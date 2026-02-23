/**
 * Directory exporter
 * Exports government directory entities (departments, executive offices, etc.) to JSON format
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { PayloadClient } from '../payload-client.js';
import {
  unwrapArrayField,
  type OfficialInline,
  PARENT_FIELD_MAP,
} from '../utils/reverse-transformers.js';
import { ENTITY_TYPE_TO_EXPORT_KEY } from '../utils/migrate-department-entities.js';

/**
 * Cache for bulk-fetched official assignments.
 * Fetches all assignments for a parent_type in one query,
 * then provides O(1) lookup by parent entity ID.
 */
class BulkAssignmentCache {
  private cache = new Map<string, Map<number, any[]>>();

  async getAssignments(
    payload: PayloadClient,
    parentType: string,
    parentId: number | string,
    context?: string
  ): Promise<any[]> {
    if (!this.cache.has(parentType)) {
      await this.prefetch(payload, parentType);
    }
    const assignments = this.cache.get(parentType)?.get(Number(parentId)) || [];
    return context
      ? assignments.filter(a => a.context === context)
      : assignments;
  }

  private async prefetch(
    payload: PayloadClient,
    parentType: string
  ): Promise<void> {
    const parentField = PARENT_FIELD_MAP[parentType];
    if (!parentField) {
      this.cache.set(parentType, new Map());
      return;
    }

    const result = await payload.find({
      collection: 'official-assignments',
      where: { parent_type: { equals: parentType } },
      depth: 2,
      limit: 10000,
    });

    const grouped = new Map<number, any[]>();
    for (const doc of result.docs) {
      const docAny = doc as any;
      const pid =
        docAny[parentField] !== null && typeof docAny[parentField] === 'object'
          ? docAny[parentField].id
          : docAny[parentField];
      if (pid == null) continue;
      const numericPid = Number(pid);
      if (!grouped.has(numericPid)) {
        grouped.set(numericPid, []);
      }
      grouped.get(numericPid)!.push(doc);
    }

    this.cache.set(parentType, grouped);
  }
}

/**
 * Reconstruct comma-separated name format from official components
 * Format: "LASTNAME, FIRSTNAME M., SUFFIX" or "LASTNAME, FIRSTNAME"
 * Handles single-word names like "VACANT" where first_name === last_name
 */
function reconstructCommaSeparatedName(official: any): string {
  if (!official) return '';

  const { first_name, last_name, suffix } = official;

  // Handle VACANT (single-word name where first_name === last_name)
  if (first_name === last_name && first_name === 'VACANT') {
    return 'VACANT';
  }

  // Build name: "LASTNAME, FIRSTNAME M."
  let name = `${last_name}, ${first_name}`;

  // Add suffix if present
  // Always prepend with comma - source format uses comma for all separated suffixes
  // Examples: "LASTNAME, FIRSTNAME, JR." or "LASTNAME, FIRSTNAME, JR., MD, FPSO-HNS"
  if (suffix) {
    name += `, ${suffix}`;
  }

  return name;
}

/**
 * Convert a position name to a field name
 * Examples:
 * - "Officer-in-Charge" → "officer_in_charge"
 * - "Officer-in-Charge (Director)" → "officer_in_charge_director"
 * - "President and CEO" → "president_and_ceo"
 */
function positionNameToFieldName(positionName: string): string {
  return positionName
    .toLowerCase()
    .replace(/\s*\(([^)]+)\)/g, '_$1') // Convert "(text)" to "_text"
    .replace(/[\s-]+/g, '_'); // Convert spaces and hyphens to underscores
}

/**
 * Filter assignments by context and map to inline officials
 * @param assignments Array of official assignments
 * @param context Context to filter by
 * @param includePositionRole Whether to include position role in the inline object
 * @returns Array of inline officials
 */
function getAssignmentsByContext(
  assignments: any[],
  context: string,
  includePositionRole = false
): OfficialInline[] {
  return assignments
    .filter(a => a.context === context)
    .map(a => assignmentToInline(a, includePositionRole));
}

/**
 * Deduplicate items by their name field
 * @param items Array of items with name property
 * @returns Array of unique items
 */
function deduplicateByName<T extends { name: string }>(items: T[]): T[] {
  return Array.from(new Map(items.map(o => [o.name, o])).values());
}

/**
 * Bureau/Service export structure
 */
interface BureauExport {
  name: string;
  director?: string;
  assistant_director?: string;
  address?: string;
  contact?: string;
  email?: string;
  website?: string;
  divisions?: Array<{
    name: string;
    head?: string;
    contact?: string;
    email?: string;
    [key: string]: any;
  }>;
  [key: string]: any;
}

/**
 * Regional office export structure
 * Dynamic to support OIC variants
 */
interface RegionalOfficeExport {
  region: string;
  address?: string;
  contact?: string;
  email?: string;
  [key: string]: string | undefined; // Allow any position field
}

/**
 * Attached agency export structure
 * Dynamic to support 17+ different position types
 */
interface AttachedAgencyExport {
  name: string;
  address?: string;
  contact?: string;
  email?: string;
  website?: string;
  trunkline?: string;
  [key: string]: string | undefined; // Allow any position field
}

/**
 * Department export structure
 */
export interface DepartmentExport {
  slug: string;
  office_name: string;
  address: string;
  trunkline: string;
  website: string;
  email?: string;
  satellite_office?: string;
  secretary?: OfficialInline;
  undersecretaries?: OfficialInline[];
  assistant_secretaries?: OfficialInline[];
  directors?: OfficialInline[];
  staff?: OfficialInline[];
  chief_coordinator?: OfficialInline;
  national_prosecution_service?: OfficialInline[];
  office_of_the_chief_state_counsel?: OfficialInline[];
  bureaus?: BureauExport[];
  regional_offices?: RegionalOfficeExport[];
  attached_agencies?: AttachedAgencyExport[];
  public_assistance_desk?: {
    office: string;
    contact?: string;
    email?: string;
    [key: string]: any;
  };
  // Dynamic entity arrays (indexed by export key)
  [key: string]: any;
}

/**
 * Executive office export structure
 */
export interface ExecutiveOfficeExport {
  slug: string;
  office: string;
  address?: string;
  trunkline?: string;
  phone?: string;
  website?: string;
  email?: string;
  officials?: Array<
    | OfficialInline
    | {
        office_division: string;
        personnel: OfficialInline[];
      }
  >;
  bureaus?: Array<{
    name: string;
    address?: string;
    phone?: string;
    website?: string;
  }>;
  attached_agency?: Array<{
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
  }>;
}

/**
 * Constitutional body export structure
 */
export interface ConstitutionalBodyExport {
  slug: string;
  office_type: string;
  name: string;
  description?: string;
  address?: string;
  trunkline?: string; // Singular for roundtrip parity with source data that uses singular
  trunklines?: string[];
  phone?: string;
  email?: string;
  region?: string;
  satellite_office?: string;
  website?: string;
  head?: OfficialInline;
  deputy_head?: OfficialInline;
  commissioners?: OfficialInline[];
  justices?: OfficialInline[];
  members?: OfficialInline[];
  officials?: Array<{
    role: string;
    name: string;
    contact?: string;
    email?: string;
    office?: string;
  }>;
  regional_offices?: Array<{
    region: string;
    address?: string;
    contact?: string;
    email?: string;
    title?: string;
    [key: string]: any;
  }>;
  public_assistance?: {
    office: string;
    contact?: string;
    email?: string;
    [key: string]: any;
  };
}

/**
 * House leaders structure
 */
export interface HouseLeaders {
  speaker: {
    name: string;
    contact: {
      contact: string;
    };
  };
  deputy_speakers: Array<{
    name: string;
    contact: {
      contact: string;
    };
  }>;
  majority_floor_leader: {
    name: string;
    contact: {
      contact: string;
    };
  };
  senior_deputy_majority_floor_leader: {
    name: string;
    contact: {
      contact: string;
    };
  };
  minority_floor_leader: {
    name: string;
    contact: {
      contact: string;
    };
  };
  senior_deputy_minority_floor_leader: {
    name: string;
    contact: {
      contact: string;
    };
  };
}

/**
 * Legislative chamber export structure
 */
export interface LegislativeExport {
  slug: string;
  branch: string;
  chamber: string;
  address?: string;
  trunkline?: string;
  website?: string;
  president?: OfficialInline;
  speaker?: OfficialInline;
  majority_leader?: OfficialInline;
  minority_leader?: OfficialInline;
  deputy_speakers?: OfficialInline[];
  officials?: Array<{
    role: string;
    name: string;
    contact?: string;
  }>;
  secretariat_officials?: Array<{
    role: string;
    name: string;
    office?: string;
    contact?: string;
  }>;
  permanent_committees?: Array<{
    committee: string;
    chairperson: string;
  }>;
  house_leaders?: HouseLeaders;
  house_members?: Array<{
    province_city: string;
    name: string;
    district: string;
    contact: string;
  }>;
  party_list_representatives?: Array<{
    party_list: string;
    name: string;
    contact: string;
  }>;
  house_committees?: {
    chairpersons: Array<{
      committee: string;
      name: string;
    }>;
  };
  special_committees?: Array<{
    committee: string;
    chairperson: string;
  }>;
}

/**
 * House member export structure
 */
export interface HouseMemberExport {
  name: string;
  district: string;
  province_city: string;
  contact?: string;
}

/**
 * Party-list representative export structure
 */
export interface PartyListRepExport {
  name: string;
  party_list: string;
  contact?: string;
}

/**
 * Diplomatic mission export structure (categorized)
 */
export interface DiplomaticMissionExport {
  country: string;
  slug: string;
  office_name: string;
  address?: string;
  contact?: string;
  email?: string;
  website?: string;
  representative?: string;
  ambassador?: string;
  consul_general?: string;
  charge_d_affaires?: string;
}

/**
 * Convert official assignment to inline object
 */
function assignmentToInline(
  assignment: any,
  includePositionRole: boolean = false
): OfficialInline {
  const official =
    typeof assignment.official === 'object' ? assignment.official : null;
  if (!official) {
    return { name: '' };
  }

  // Include suffix in name reconstruction (preserve original casing)
  const nameParts = [
    official.first_name,
    official.middle_name,
    official.last_name,
    official.suffix,
  ].filter(Boolean);

  // Handle single-word names (e.g., "VACANT" where first_name === last_name)
  let name: string;
  if (nameParts.length === 2 && official.first_name === official.last_name) {
    name = official.first_name;
  } else {
    name = nameParts.join(' ');
  }

  const inline: OfficialInline = { name };

  // Add role from custom_role field on assignment, or from position type if requested
  if (assignment.custom_role) {
    inline.role = assignment.custom_role;
  } else if (includePositionRole && assignment.position?.name) {
    inline.role = assignment.position.name;
  }

  // Add contact and email: prefer assignment-specific values, fall back to official record
  const contact = assignment.contact || official.contact;
  const email = assignment.email || official.email;
  if (contact) inline.contact = contact;
  if (email) inline.email = email;

  return inline;
}

/**
 * Query bureaus for a department and format for export
 */
async function queryBureaus(
  payload: PayloadClient,
  departmentId: number,
  cache: BulkAssignmentCache
): Promise<BureauExport[]> {
  const result = await payload.find({
    collection: 'bureaus',
    where: {
      department: { equals: departmentId },
    },
    depth: 0,
    limit: 1000,
  });

  const bureaus: BureauExport[] = [];

  for (const doc of result.docs) {
    // Query officials for this bureau
    const assignments = await cache.getAssignments(payload, 'bureaus', doc.id);

    const bureau: BureauExport = {
      name: doc.name,
    };

    // Dynamically add all officials based on their position names
    for (const assignment of assignments) {
      const positionName = assignment.position?.name;
      if (positionName) {
        const fieldName = positionNameToFieldName(positionName);
        bureau[fieldName] = assignmentToInline(assignment).name;
      }
    }

    if (doc.address) bureau.address = doc.address;
    if (doc.contact) bureau.contact = doc.contact;
    if (doc.email) bureau.email = doc.email;
    if (doc.website) bureau.website = doc.website;

    // Query divisions for this bureau
    const divisionsResult = await payload.find({
      collection: 'bureau-divisions',
      where: { bureau: { equals: doc.id } },
      depth: 0,
      limit: 1000,
    });

    if (divisionsResult.docs.length > 0) {
      const divisions: any[] = [];
      for (const divDoc of divisionsResult.docs) {
        const division: any = { name: divDoc.name };

        // Query officials for this division
        const divAssignments = await cache.getAssignments(
          payload,
          'bureau-divisions',
          divDoc.id
        );
        for (const assignment of divAssignments) {
          const positionName = assignment.position?.name;
          if (positionName) {
            // Use "head" for division heads (not "division_head")
            const fieldName = positionName.toLowerCase().includes('head')
              ? 'head'
              : positionNameToFieldName(positionName);
            division[fieldName] = assignmentToInline(assignment).name;
          }
        }

        if (divDoc.contact) division.contact = divDoc.contact;
        if (divDoc.email) division.email = divDoc.email;

        divisions.push(division);
      }
      bureau.divisions = divisions;
    }

    bureaus.push(bureau);
  }

  return bureaus;
}

/**
 * Query regional offices for a department and format for export
 */
async function queryRegionalOffices(
  payload: PayloadClient,
  departmentId: number,
  cache: BulkAssignmentCache
): Promise<RegionalOfficeExport[]> {
  const result = await payload.find({
    collection: 'regional-offices',
    where: {
      department: { equals: departmentId },
    },
    depth: 1, // Populate region relationship
    limit: 1000,
  });

  const offices: RegionalOfficeExport[] = [];

  for (const doc of result.docs) {
    // Query officials for this regional office
    const assignments = await cache.getAssignments(
      payload,
      'regional-offices',
      doc.id
    );

    // Get region name (stored as text in the schema)
    const regionName =
      typeof doc.region === 'string'
        ? doc.region
        : (doc.region as any)?.region_name || 'Unknown Region';

    const office: RegionalOfficeExport = {
      region: regionName,
    };

    // Dynamically add all position assignments based on context
    for (const assignment of assignments) {
      if (assignment.context) {
        const inline = assignmentToInline(assignment);
        office[assignment.context] = inline.name;
        // If there's a custom role, add it as a separate 'role' field
        if (inline.role) {
          office.role = inline.role;
        }
      }
    }

    // Add metadata fields
    if (doc.address) office.address = doc.address;
    if (doc.contact) office.contact = doc.contact;
    if (doc.email) office.email = doc.email;

    offices.push(office);
  }

  return offices;
}

/**
 * Query attached agencies for a department and format for export
 */
async function queryAttachedAgencies(
  payload: PayloadClient,
  departmentId: number,
  cache: BulkAssignmentCache
): Promise<AttachedAgencyExport[]> {
  const result = await payload.find({
    collection: 'attached-agencies',
    where: {
      department: { equals: departmentId },
    },
    depth: 0,
    limit: 1000,
  });

  const agencies: AttachedAgencyExport[] = [];

  for (const doc of result.docs) {
    // Query officials for this agency
    const assignments = await cache.getAssignments(
      payload,
      'attached-agencies',
      doc.id
    );

    const agency: AttachedAgencyExport = {
      name: doc.name,
    };

    // Dynamically add all position assignments based on context
    for (const assignment of assignments) {
      if (assignment.context) {
        agency[assignment.context] = assignmentToInline(assignment).name;
      }
    }

    // Add metadata fields
    if (doc.address) agency.address = doc.address;
    if (doc.contact) agency.contact = doc.contact;
    if (doc.email) agency.email = doc.email;
    if (doc.website) agency.website = doc.website;
    if (doc.trunkline) agency.trunkline = doc.trunkline;

    agencies.push(agency);
  }

  return agencies;
}

/**
 * Export department entities and add them to the department export
 */
async function exportDepartmentEntities(
  payload: PayloadClient,
  departmentId: number,
  dept: DepartmentExport,
  cache: BulkAssignmentCache
): Promise<void> {
  // Query all department entities for this department
  const result = await payload.find({
    collection: 'department-entities',
    where: {
      department: { equals: departmentId },
    },
    depth: 0,
    limit: 1000,
  });

  // Group entities by entity_type
  const entitiesByType = new Map<string, any[]>();

  for (const doc of result.docs) {
    const entityType = doc.entity_type;
    if (!entityType) continue;

    // Get the export key for this entity type
    const exportKey = ENTITY_TYPE_TO_EXPORT_KEY[entityType];
    if (!exportKey) continue;

    // Query officials for this entity
    const assignments = await cache.getAssignments(
      payload,
      'department-entities',
      doc.id
    );

    const entity: any = {
      name: doc.name,
    };

    // Add optional fields
    if (doc.city) entity.city = doc.city;
    if (doc.address) entity.address = doc.address;
    if (doc.contact) entity.contact = doc.contact;
    if (doc.email) entity.email = doc.email;
    if (doc.website) entity.website = doc.website;
    if (doc.title) entity.title = doc.title;

    // Special handling for entities that use 'country' instead of 'name'
    if (
      entityType === 'migrant_workers_office' ||
      entityType === 'foreign_service_establishment'
    ) {
      entity.country = doc.name;
      delete entity.name;
      if (doc.region) entity.region = doc.region;
    }
    // Special handling for regional prosecutor offices that use 'region' instead of 'name'
    else if (entityType === 'regional_prosecutor_office') {
      entity.region = doc.name;
      delete entity.name;
    }
    // philippine_mission uses 'name', not 'country', so no special handling needed

    // Add officials dynamically based on position names
    for (const assignment of assignments) {
      // Get the position name and convert to field name
      // e.g., "Executive Director" -> "executive_director"
      const positionName = assignment.position?.name;
      if (positionName) {
        const inline = assignmentToInline(assignment);
        const fieldName = positionNameToFieldName(positionName);
        entity[fieldName] = inline.name;
        // If there's a custom role, add it as a separate 'role' field
        if (inline.role) {
          entity.role = inline.role;
        }
      }
    }

    // Add to the group for this export key
    if (!entitiesByType.has(exportKey)) {
      entitiesByType.set(exportKey, []);
    }
    entitiesByType.get(exportKey)!.push(entity);
  }

  // Add grouped entities to the department export
  for (const [exportKey, entities] of entitiesByType) {
    dept[exportKey] = entities;
  }
}

/**
 * Export departments with officials
 */
export async function exportDepartments(
  payload: PayloadClient
): Promise<DepartmentExport[]> {
  console.log('📦 Exporting departments...');

  const result = await payload.find({
    collection: 'departments',
    limit: 1000,
    sort: 'office_name',
  });

  console.log(`   Found ${result.docs.length} departments`);

  const cache = new BulkAssignmentCache();
  const departments: DepartmentExport[] = [];

  for (const doc of result.docs) {
    const dept: DepartmentExport = {
      slug: doc.slug,
      office_name: doc.office_name,
      address: doc.address || '',
      trunkline: doc.trunkline || '',
      website: doc.website || '',
    };

    // Add optional email and satellite_office fields
    if (doc.email) dept.email = doc.email;
    if (doc.satellite_office) dept.satellite_office = doc.satellite_office;

    // Query official assignments
    const assignments = await cache.getAssignments(
      payload,
      'departments',
      doc.id
    );

    // Group assignments by context
    const secretary = assignments.find(a => a.context === 'secretary');
    if (secretary) {
      dept.secretary = assignmentToInline(secretary);
    }

    const undersecretaries = getAssignmentsByContext(
      assignments,
      'undersecretaries'
    );
    if (undersecretaries.length > 0) {
      dept.undersecretaries = undersecretaries;
    }

    const assistantSecretaries = getAssignmentsByContext(
      assignments,
      'assistant_secretaries'
    );
    if (assistantSecretaries.length > 0) {
      dept.assistant_secretaries = assistantSecretaries;
    }

    // Export officials-only arrays (directors, staff, chief_coordinator)
    const uniqueDirectors = deduplicateByName(
      getAssignmentsByContext(assignments, 'directors')
    );
    if (uniqueDirectors.length > 0) {
      dept.directors = uniqueDirectors;
    }

    const uniqueStaff = deduplicateByName(
      getAssignmentsByContext(assignments, 'staff')
    );
    if (uniqueStaff.length > 0) {
      dept.staff = uniqueStaff;
    }

    const chiefCoordinator = assignments.find(
      a => a.context === 'chief_coordinator'
    );
    if (chiefCoordinator) {
      dept.chief_coordinator = assignmentToInline(chiefCoordinator);
    }

    // National prosecution service - deduplicate by official name
    const uniqueNPS = deduplicateByName(
      getAssignmentsByContext(assignments, 'national_prosecution_service', true)
    );
    if (uniqueNPS.length > 0) {
      dept.national_prosecution_service = uniqueNPS;
    }

    // Office of the chief state counsel - deduplicate by official name
    const uniqueOCSC = deduplicateByName(
      getAssignmentsByContext(
        assignments,
        'office_of_the_chief_state_counsel',
        true
      )
    );
    if (uniqueOCSC.length > 0) {
      dept.office_of_the_chief_state_counsel = uniqueOCSC;
    }

    // Query bureaus and services
    const bureaus = await queryBureaus(payload, doc.id, cache);
    if (bureaus.length > 0) {
      dept.bureaus = bureaus;
    }

    // Query regional offices
    const regionalOffices = await queryRegionalOffices(payload, doc.id, cache);
    if (regionalOffices.length > 0) {
      dept.regional_offices = regionalOffices;
    }

    // Query attached agencies
    const attachedAgencies = await queryAttachedAgencies(
      payload,
      doc.id,
      cache
    );
    if (attachedAgencies.length > 0) {
      dept.attached_agencies = attachedAgencies;
    }

    // Export public_assistance_desk
    if (doc.public_assistance_desk?.office) {
      const padPerson = assignments.find(
        a => a.context === 'public_assistance_desk'
      );
      const padExport: any = {
        office: doc.public_assistance_desk.office,
      };
      if (doc.public_assistance_desk.contact) {
        padExport.contact = doc.public_assistance_desk.contact;
      }
      if (doc.public_assistance_desk.email) {
        padExport.email = doc.public_assistance_desk.email;
      }
      if (padPerson) {
        // Determine the field name from the position (e.g., "Chief" -> "chief", "Director" -> "director")
        const inline = assignmentToInline(padPerson);
        const fieldName = padPerson.position?.name
          ? positionNameToFieldName(padPerson.position.name)
          : 'chief';
        padExport[fieldName] = inline.name;
        // Add title if there's a custom role
        if (inline.role) {
          padExport.title = inline.role;
        }
      }
      dept.public_assistance_desk = padExport;
    }

    // Export department entities (Phase 4)
    await exportDepartmentEntities(payload, doc.id, dept, cache);

    departments.push(dept);
  }

  console.log(`✅ Exported ${departments.length} departments`);
  return departments;
}

/**
 * Export executive offices with officials
 */
export async function exportExecutiveOffices(
  payload: PayloadClient
): Promise<ExecutiveOfficeExport[]> {
  console.log('📦 Exporting executive offices...');

  const result = await payload.find({
    collection: 'executive-offices',
    limit: 1000,
    sort: 'office',
  });

  console.log(`   Found ${result.docs.length} executive offices`);

  const cache = new BulkAssignmentCache();
  const offices: ExecutiveOfficeExport[] = [];

  for (const doc of result.docs) {
    const office: ExecutiveOfficeExport = {
      slug: doc.slug,
      office: doc.office,
    };

    // Add optional fields
    if (doc.address) office.address = doc.address;
    if (doc.trunkline) office.trunkline = doc.trunkline;
    if (doc.phone) office.phone = doc.phone;
    if (doc.website) office.website = doc.website;
    if (doc.email) office.email = doc.email;

    // Query official assignments
    const assignments = await cache.getAssignments(
      payload,
      'executive-offices',
      doc.id
    );

    if (assignments.length > 0) {
      // Group assignments by office_division (context)
      const divisionMap: Record<string, any[]> = {};
      const topLevelOfficials: any[] = [];

      for (const assignment of assignments) {
        if (assignment.office_division) {
          if (!divisionMap[assignment.office_division]) {
            divisionMap[assignment.office_division] = [];
          }
          divisionMap[assignment.office_division].push(assignment);
        } else {
          topLevelOfficials.push(assignment);
        }
      }

      const officials: ExecutiveOfficeExport['officials'] = [];

      // Add top-level officials first (include position role in output)
      for (const assignment of topLevelOfficials) {
        officials.push(assignmentToInline(assignment, true));
      }

      // Add division-based officials (include position role in output)
      for (const [division, divisionAssignments] of Object.entries(
        divisionMap
      )) {
        officials.push({
          office_division: division,
          personnel: divisionAssignments.map(a => assignmentToInline(a, true)),
        });
      }

      if (officials.length > 0) {
        office.officials = officials;
      }
    }

    // Query bureaus for executive offices (e.g., Presidential Communications Office)
    const bureausResult = await payload.find({
      collection: 'bureaus',
      where: {
        executive_office: { equals: doc.id },
      },
      depth: 0,
      limit: 1000,
    });

    if (bureausResult.docs.length > 0) {
      const bureaus: any[] = [];
      for (const bureau of bureausResult.docs) {
        const bureauData: any = { name: bureau.name };
        if (bureau.address) bureauData.address = bureau.address;
        if (bureau.phone) bureauData.phone = bureau.phone;
        if (bureau.website) bureauData.website = bureau.website;
        bureaus.push(bureauData);
      }
      office.bureaus = bureaus;
    }

    // Query attached agencies for executive offices
    const attachedResult = await payload.find({
      collection: 'attached-agencies',
      where: {
        executive_office: { equals: doc.id },
      },
      depth: 0,
      limit: 1000,
    });

    if (attachedResult.docs.length > 0) {
      const agencies: any[] = [];
      for (const agency of attachedResult.docs) {
        const agencyData: any = { name: agency.name };
        if (agency.address) agencyData.address = agency.address;
        if (agency.phone) agencyData.phone = agency.phone;
        if (agency.email) agencyData.email = agency.email;
        if (agency.website) agencyData.website = agency.website;
        agencies.push(agencyData);
      }
      office.attached_agency = agencies;
    }

    offices.push(office);
  }

  console.log(`✅ Exported ${offices.length} executive offices`);
  return offices;
}

/**
 * Export constitutional bodies with officials
 */
export async function exportConstitutionalBodies(
  payload: PayloadClient
): Promise<ConstitutionalBodyExport[]> {
  console.log('📦 Exporting constitutional bodies...');

  const result = await payload.find({
    collection: 'constitutional-bodies',
    limit: 1000,
    sort: 'name',
  });

  console.log(`   Found ${result.docs.length} constitutional bodies`);

  const cache = new BulkAssignmentCache();
  const bodies: ConstitutionalBodyExport[] = [];

  for (const doc of result.docs) {
    const body: ConstitutionalBodyExport = {
      slug: doc.slug,
      office_type: doc.office_type || '',
      name: doc.name,
    };

    // Add optional fields
    if (doc.description) body.description = doc.description;
    if (doc.address) body.address = doc.address;
    if (doc.website) body.website = doc.website;
    if (doc.phone) body.phone = doc.phone;
    if (doc.email) body.email = doc.email;
    if (doc.region) body.region = doc.region;
    if (doc.satellite_office) body.satellite_office = doc.satellite_office;

    // Handle trunklines array
    // For roundtrip parity: if there's only one trunkline, export as singular 'trunkline'
    // to match source data that used singular format
    if (doc.trunklines && Array.isArray(doc.trunklines)) {
      const trunklines = unwrapArrayField<string>(
        doc.trunklines as Array<Record<string, string>>,
        'number'
      );
      if (trunklines.length === 1) {
        // Single trunkline - export as singular for roundtrip parity
        body.trunkline = trunklines[0];
      } else if (trunklines.length > 1) {
        // Multiple trunklines - export as array
        body.trunklines = trunklines;
      }
    }

    // Query official assignments
    const assignments = await cache.getAssignments(
      payload,
      'constitutional-bodies',
      doc.id
    );

    // Group by context
    const head = assignments.find(a => a.context === 'head');
    if (head) body.head = assignmentToInline(head);

    const deputyHead = assignments.find(a => a.context === 'deputy_head');
    if (deputyHead) body.deputy_head = assignmentToInline(deputyHead);

    const commissioners = getAssignmentsByContext(assignments, 'commissioners');
    if (commissioners.length > 0) body.commissioners = commissioners;

    const justices = getAssignmentsByContext(assignments, 'justices');
    if (justices.length > 0) body.justices = justices;

    const members = getAssignmentsByContext(assignments, 'members');
    if (members.length > 0) body.members = members;

    // Export officials array for constitutional bodies that have them
    if (assignments.some(a => a.context === 'officials')) {
      const officials = assignments
        .filter(a => a.context === 'officials')
        .map(assignment => {
          const official: any = {
            // Prefer original source role text, fall back to normalized position name
            role: assignment.position?.name || 'Official',
            name: assignmentToInline(assignment).name,
          };

          // Add contact: prefer assignment-specific contact, fall back to official record
          const contact = assignment.contact || assignment.official?.contact;
          if (contact) {
            official.contact = contact;
          }

          // Add email: prefer assignment-specific email, fall back to official record
          const email = assignment.email || assignment.official?.email;
          if (email) {
            official.email = email;
          }

          // Add office from custom_role if present
          if (assignment.custom_role) {
            official.office = assignment.custom_role;
          }

          return official;
        });

      body.officials = officials;
    }

    // Query regional offices for constitutional bodies
    const regionalResult = await payload.find({
      collection: 'regional-offices',
      where: {
        constitutional_body: { equals: doc.id },
      },
      depth: 1,
      limit: 1000,
    });

    if (regionalResult.docs.length > 0) {
      const regionalOffices: any[] = [];
      for (const office of regionalResult.docs) {
        const regionName =
          typeof office.region === 'string'
            ? office.region
            : (office.region as any)?.region_name || 'Unknown Region';

        const officeData: any = { region: regionName };

        // Query officials for this regional office
        const officeAssignments = await cache.getAssignments(
          payload,
          'regional-offices',
          office.id
        );

        // Add officials dynamically based on context
        for (const assignment of officeAssignments) {
          if (assignment.context) {
            const inline = assignmentToInline(assignment);
            officeData[assignment.context] = inline.name;
            // Constitutional bodies use "title" instead of "role"
            if (inline.role) {
              officeData.title = inline.role;
            }
          }
        }

        // Add metadata fields
        if (office.address) officeData.address = office.address;
        if (office.contact) officeData.contact = office.contact;
        if (office.email) officeData.email = office.email;

        regionalOffices.push(officeData);
      }
      body.regional_offices = regionalOffices;
    }

    // Export public_assistance if present
    if (doc.public_assistance_desk?.office) {
      const padAssignment = assignments.find(
        a => a.context === 'public_assistance_desk'
      );
      const padExport: any = {
        office: doc.public_assistance_desk.office,
      };
      if (doc.public_assistance_desk.contact) {
        padExport.contact = doc.public_assistance_desk.contact;
      }
      if (doc.public_assistance_desk.email) {
        padExport.email = doc.public_assistance_desk.email;
      }
      if (padAssignment) {
        // Determine field name from position
        const positionName = padAssignment.position?.name;
        if (positionName) {
          const inline = assignmentToInline(padAssignment);
          const fieldName = positionNameToFieldName(positionName);
          padExport[fieldName] = inline.name;
          // Add title if there's a custom role
          if (inline.role) {
            padExport.title = inline.role;
          }
        }
      }
      body.public_assistance = padExport;
    }

    bodies.push(body);
  }

  console.log(`✅ Exported ${bodies.length} constitutional bodies`);
  return bodies;
}

/**
 * Export legislative chambers with officials
 */
export async function exportLegislative(
  payload: PayloadClient
): Promise<LegislativeExport[]> {
  console.log('📦 Exporting legislative chambers...');

  const result = await payload.find({
    collection: 'legislative',
    limit: 1000,
    sort: 'chamber',
  });

  console.log(`   Found ${result.docs.length} legislative chambers`);

  const cache = new BulkAssignmentCache();
  const chambers: LegislativeExport[] = [];

  for (const doc of result.docs) {
    const chamber: LegislativeExport = {
      slug: doc.slug,
      branch: doc.branch,
      chamber: doc.chamber,
    };

    // Add optional fields
    if (doc.address) chamber.address = doc.address;
    if (doc.trunkline) chamber.trunkline = doc.trunkline;
    if (doc.website) chamber.website = doc.website;

    // Query official assignments
    const assignments = await cache.getAssignments(
      payload,
      'legislative',
      doc.id
    );

    // Map by context (these are for Senate-specific structure)
    // Note: House doesn't use these fields - it uses house_leaders instead
    const president = assignments.find(a => a.context === 'president');
    if (president) chamber.president = assignmentToInline(president);

    const majorityLeader = assignments.find(
      a => a.context === 'majority_leader'
    );
    if (majorityLeader)
      chamber.majority_leader = assignmentToInline(majorityLeader);

    const minorityLeader = assignments.find(
      a => a.context === 'minority_leader'
    );
    if (minorityLeader)
      chamber.minority_leader = assignmentToInline(minorityLeader);

    // Export officials array (senators, representatives, etc.)
    if (assignments.some(a => a.context === 'officials')) {
      const officials = assignments
        .filter(a => a.context === 'officials')
        .map(assignment => {
          const official: any = {
            role: assignment.position?.name || 'Official',
            name: assignmentToInline(assignment).name,
          };

          // Add contact from assignment or official record
          const contact = assignment.contact || assignment.official?.contact;
          if (contact) {
            official.contact = contact;
          }

          return official;
        });

      chamber.officials = officials;
    }

    // Export secretariat_officials array
    if (assignments.some(a => a.context === 'secretariat')) {
      const secretariatOfficials = assignments
        .filter(a => a.context === 'secretariat')
        .map(assignment => {
          const official: any = {
            role: assignment.position?.name || 'Official',
            name: assignmentToInline(assignment).name,
          };

          // Add contact from assignment or official record
          const contact = assignment.contact || assignment.official?.contact;
          if (contact) {
            official.contact = contact;
          }

          // Add email from assignment or official record
          const email = assignment.email || assignment.official?.email;
          if (email) {
            official.email = email;
          }

          // Add office from custom_role if present
          if (assignment.custom_role) {
            official.office = assignment.custom_role;
          }

          return official;
        });

      chamber.secretariat_officials = secretariatOfficials;
    }

    // Export permanent committees (Senate only - House uses house_committees instead)
    if (doc.slug === 'senate-of-the-philippines-20th-congress') {
      const committees = await payload.find({
        collection: 'committees',
        where: {
          chamber: { equals: doc.id },
          committee_type: { equals: 'permanent' },
        },
        depth: 1,
        limit: 100,
      });

      console.log(
        `   Chamber ${doc.slug} (ID: ${doc.id}): Found ${committees.docs.length} committees`
      );

      if (committees.docs.length > 0) {
        const permanentCommittees = [];

        for (const committee of committees.docs) {
          // Query chairperson assignment
          const chairAssignments = await cache.getAssignments(
            payload,
            'committees',
            committee.id,
            'chairperson'
          );

          const committeeData: any = {
            committee: committee.name,
            chairperson:
              chairAssignments.length > 0
                ? assignmentToInline(chairAssignments[0]).name
                : 'VACANT',
          };

          permanentCommittees.push(committeeData);
        }

        if (permanentCommittees.length > 0) {
          chamber.permanent_committees = permanentCommittees;
        }
      }
    }

    // Export House-specific data structures
    if (doc.slug === 'house-of-representatives-20th-congress') {
      // Export house_leaders
      const houseLeaderContexts = [
        'speaker',
        'deputy_speakers',
        'majority_floor_leader',
        'senior_deputy_majority_floor_leader',
        'minority_floor_leader',
        'senior_deputy_minority_floor_leader',
      ];

      const hasHouseLeaders = assignments.some(a =>
        houseLeaderContexts.includes(a.context || '')
      );

      if (hasHouseLeaders) {
        const houseLeaders: any = {};

        // Speaker
        const speakerAssignment = assignments.find(
          a => a.context === 'speaker'
        );
        if (speakerAssignment) {
          houseLeaders.speaker = {
            name: assignmentToInline(speakerAssignment).name,
            contact: {
              contact:
                speakerAssignment.contact ||
                speakerAssignment.official?.contact ||
                '',
            },
          };
        }

        // Deputy speakers
        const deputySpeakersAssignments = assignments.filter(
          a => a.context === 'deputy_speakers'
        );
        if (deputySpeakersAssignments.length > 0) {
          houseLeaders.deputy_speakers = deputySpeakersAssignments.map(a => ({
            name: assignmentToInline(a).name,
            contact: {
              contact: a.contact || a.official?.contact || '',
            },
          }));
        }

        // Majority floor leader
        const majorityFloorLeader = assignments.find(
          a => a.context === 'majority_floor_leader'
        );
        if (majorityFloorLeader) {
          houseLeaders.majority_floor_leader = {
            name: assignmentToInline(majorityFloorLeader).name,
            contact: {
              contact:
                majorityFloorLeader.contact ||
                majorityFloorLeader.official?.contact ||
                '',
            },
          };
        }

        // Senior deputy majority floor leader
        const seniorDepMajority = assignments.find(
          a => a.context === 'senior_deputy_majority_floor_leader'
        );
        if (seniorDepMajority) {
          houseLeaders.senior_deputy_majority_floor_leader = {
            name: assignmentToInline(seniorDepMajority).name,
            contact: {
              contact:
                seniorDepMajority.contact ||
                seniorDepMajority.official?.contact ||
                '',
            },
          };
        }

        // Minority floor leader
        const minorityFloorLeader = assignments.find(
          a => a.context === 'minority_floor_leader'
        );
        if (minorityFloorLeader) {
          houseLeaders.minority_floor_leader = {
            name: assignmentToInline(minorityFloorLeader).name,
            contact: {
              contact:
                minorityFloorLeader.contact ||
                minorityFloorLeader.official?.contact ||
                '',
            },
          };
        }

        // Senior deputy minority floor leader
        const seniorDepMinority = assignments.find(
          a => a.context === 'senior_deputy_minority_floor_leader'
        );
        if (seniorDepMinority) {
          houseLeaders.senior_deputy_minority_floor_leader = {
            name: assignmentToInline(seniorDepMinority).name,
            contact: {
              contact:
                seniorDepMinority.contact ||
                seniorDepMinority.official?.contact ||
                '',
            },
          };
        }

        chamber.house_leaders = houseLeaders;
      }

      // Export house_members (from official-assignments)
      const houseMemberAssignments = await cache.getAssignments(
        payload,
        'legislative',
        doc.id,
        'house_members'
      );

      if (houseMemberAssignments.length > 0) {
        chamber.house_members = houseMemberAssignments
          .filter(a => a.official)
          .map(assignment => ({
            province_city: assignment.province_city || '',
            name: reconstructCommaSeparatedName(assignment.official),
            district: assignment.district || '',
            contact: assignment.contact || '',
          }));
      }

      // Export party_list_representatives (from official-assignments)
      const partyListAssignments = await cache.getAssignments(
        payload,
        'legislative',
        doc.id,
        'party_list_representatives'
      );

      if (partyListAssignments.length > 0) {
        chamber.party_list_representatives = partyListAssignments
          .filter(a => a.official)
          .map(assignment => ({
            party_list: assignment.party_list_group || '',
            name: reconstructCommaSeparatedName(assignment.official),
            contact: assignment.contact || '',
          }));
      }

      // Export house_committees (permanent committees for House)
      const houseCommitteesResult = await payload.find({
        collection: 'committees',
        where: {
          chamber: { equals: doc.id },
          committee_type: { equals: 'permanent' },
        },
        depth: 1,
        limit: 100,
      });

      if (houseCommitteesResult.docs.length > 0) {
        const chairpersons = [];

        for (const committee of houseCommitteesResult.docs) {
          // Query chairperson assignment
          const chairAssignments = await cache.getAssignments(
            payload,
            'committees',
            committee.id,
            'chairperson'
          );

          chairpersons.push({
            committee: committee.name,
            name:
              chairAssignments.length > 0
                ? assignmentToInline(chairAssignments[0]).name
                : 'VACANT',
          });
        }

        if (chairpersons.length > 0) {
          chamber.house_committees = { chairpersons };
        }
      }

      // Export special_committees
      const specialCommitteesResult = await payload.find({
        collection: 'committees',
        where: {
          chamber: { equals: doc.id },
          committee_type: { equals: 'special' },
        },
        depth: 1,
        limit: 100,
      });

      if (specialCommitteesResult.docs.length > 0) {
        const specialCommittees = [];

        for (const committee of specialCommitteesResult.docs) {
          // Query chairperson assignment
          const chairAssignments = await cache.getAssignments(
            payload,
            'committees',
            committee.id,
            'chairperson'
          );

          specialCommittees.push({
            committee: committee.name,
            chairperson:
              chairAssignments.length > 0
                ? assignmentToInline(chairAssignments[0]).name
                : 'VACANT',
          });
        }

        if (specialCommittees.length > 0) {
          chamber.special_committees = specialCommittees;
        }
      }
    }

    chambers.push(chamber);
  }

  console.log(`✅ Exported ${chambers.length} legislative chambers`);
  return chambers;
}

/**
 * Export house members
 */
export async function exportHouseMembers(
  payload: PayloadClient
): Promise<HouseMemberExport[]> {
  console.log('📦 Exporting house members...');

  // Query official-assignments for house members
  const result = await payload.find({
    collection: 'official-assignments',
    where: {
      and: [
        { parent_type: { equals: 'legislative' } },
        { context: { equals: 'house_members' } },
      ],
    },
    depth: 2,
    limit: 1000,
    sort: 'official',
  });

  console.log(
    `   Found ${result.docs.length} house member assignments (totalDocs: ${result.totalDocs})`
  );

  const members: HouseMemberExport[] = result.docs
    .filter(assignment => assignment.official)
    .map(assignment => {
      const member: HouseMemberExport = {
        name: reconstructCommaSeparatedName(assignment.official),
        district: assignment.district || '',
        province_city: assignment.province_city || '',
      };

      if (assignment.contact) member.contact = assignment.contact;

      return member;
    });

  console.log(`✅ Exported ${members.length} house members`);
  return members;
}

/**
 * Export party-list representatives
 */
export async function exportPartyListReps(
  payload: PayloadClient
): Promise<PartyListRepExport[]> {
  console.log('📦 Exporting party-list representatives...');

  // Query official-assignments for party-list reps
  const result = await payload.find({
    collection: 'official-assignments',
    where: {
      and: [
        { parent_type: { equals: 'legislative' } },
        { context: { equals: 'party_list_representatives' } },
      ],
    },
    depth: 2,
    limit: 1000,
    sort: 'official',
  });

  console.log(
    `   Found ${result.docs.length} party-list representative assignments`
  );

  const reps: PartyListRepExport[] = result.docs
    .filter(assignment => assignment.official)
    .map(assignment => {
      const rep: PartyListRepExport = {
        name: reconstructCommaSeparatedName(assignment.official),
        party_list: assignment.party_list_group || '',
      };

      if (assignment.contact) rep.contact = assignment.contact;

      return rep;
    });

  console.log(`✅ Exported ${reps.length} party-list representatives`);
  return reps;
}

/**
 * Export diplomatic missions grouped by type
 */
export async function exportDiplomaticMissions(
  payload: PayloadClient
): Promise<{
  'Diplomatic Mission': DiplomaticMissionExport[];
  Consulate: DiplomaticMissionExport[];
  'International Organization': DiplomaticMissionExport[];
}> {
  console.log('📦 Exporting diplomatic missions...');

  const result = await payload.find({
    collection: 'diplomatic-missions',
    limit: 1000,
    sort: 'country',
  });

  console.log(`   Found ${result.docs.length} diplomatic missions`);

  const cache = new BulkAssignmentCache();
  const output: {
    'Diplomatic Mission': DiplomaticMissionExport[];
    Consulate: DiplomaticMissionExport[];
    'International Organization': DiplomaticMissionExport[];
  } = {
    'Diplomatic Mission': [],
    Consulate: [],
    'International Organization': [],
  };

  for (const doc of result.docs) {
    const mission: DiplomaticMissionExport = {
      country: doc.country,
      slug: doc.slug,
      office_name: doc.office_name,
    };

    // Add optional fields
    if (doc.address) mission.address = doc.address;
    if (doc.contact) mission.contact = doc.contact;
    if (doc.email) mission.email = doc.email;
    if (doc.website) mission.website = doc.website;

    // Query official assignments
    const assignments = await cache.getAssignments(
      payload,
      'diplomatic-missions',
      doc.id
    );

    for (const assignment of assignments) {
      const inline = assignmentToInline(assignment);

      // Map context to field
      if (assignment.context === 'representative') {
        mission.representative = inline.name;
      } else if (assignment.context === 'ambassador') {
        mission.ambassador = inline.name;
      } else if (assignment.context === 'consul_general') {
        mission.consul_general = inline.name;
      } else if (assignment.context === 'charge_d_affaires') {
        mission.charge_d_affaires = inline.name;
      }
    }

    // Add to appropriate category
    if (doc.type === 'honorary_consulates') {
      output.Consulate.push(mission);
    } else if (doc.type === 'international_organizations') {
      output['International Organization'].push(mission);
    } else {
      output['Diplomatic Mission'].push(mission);
    }
  }

  console.log(`   Diplomatic Missions: ${output['Diplomatic Mission'].length}`);
  console.log(`   Consulates: ${output.Consulate.length}`);
  console.log(
    `   International Organizations: ${output['International Organization'].length}`
  );

  console.log(`✅ Exported ${result.docs.length} diplomatic missions`);
  return output;
}
