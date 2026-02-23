/**
 * TypeScript types for Payload CMS document structures
 * Based on Payload-generated types from bgovcms/src/payload-types.ts
 * Used by export scripts to provide type safety
 */

/**
 * Base CMS document fields present in all collections
 */
export interface BaseCMSDocument {
  id: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Official record from the officials collection
 */
export interface Official extends BaseCMSDocument {
  slug: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  suffix?: string | null;
  title_prefix?: string | null;
  full_name?: string | null;
  contact?: string | null;
  email?: string | null;
  photo?: number | null;
  current_position?: string | null;
}

/**
 * Position type from the position-types collection
 */
export interface PositionType extends BaseCMSDocument {
  slug: string;
  name: string;
  category:
    | 'executive'
    | 'legislative'
    | 'constitutional'
    | 'lgu'
    | 'diplomatic';
  rank?: number | null;
  is_acting?: boolean | null;
}

/**
 * Official assignment from the official-assignments collection
 */
export interface OfficialAssignment extends BaseCMSDocument {
  official: number | Official;
  position: number | PositionType;
  custom_role?: string | null;
  parent_type:
    | 'departments'
    | 'constitutional-bodies'
    | 'executive-offices'
    | 'legislative'
    | 'localities'
    | 'diplomatic-missions'
    | 'bureaus'
    | 'bureau-divisions'
    | 'attached-agencies'
    | 'regional-offices'
    | 'committees'
    | 'department-entities';
  department?: (number | null) | Department;
  constitutional_body?: (number | null) | ConstitutionalBody;
  executive_office?: (number | null) | ExecutiveOffice;
  legislative?: (number | null) | Legislative;
  locality?: (number | null) | Locality;
  diplomatic_mission?: (number | null) | DiplomaticMission;
  bureau?: (number | null) | Bureau;
  bureau_division?: (number | null) | BureauDivision;
  attached_agency?: (number | null) | AttachedAgency;
  regional_office?: (number | null) | RegionalOffice;
  committee?: (number | null) | Committee;
  department_entity?: (number | null) | DepartmentEntity;
  context?: string | null;
  contact?: string | null;
  email?: string | null;
  office_division?: string | null;
  district?: string | null;
  province_city?: string | null;
  party_list_group?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: ('active' | 'inactive' | 'historical') | null;
  sort_order?: number | null;
}

/**
 * Region document from the regions collection
 */
export interface Region extends BaseCMSDocument {
  slug: string;
  region_code: string;
  region_name: string;
  island_group?: ('luzon' | 'visayas' | 'mindanao') | null;
}

/**
 * Province document from the provinces collection
 */
export interface Province extends BaseCMSDocument {
  slug: string;
  province_name: string;
  province_capital?: string | null;
  region: number | Region;
}

/**
 * Locality (city/municipality) document from the localities collection
 */
export interface Locality extends BaseCMSDocument {
  slug: string;
  locality_name: string;
  locality_type: 'city' | 'municipality';
  zip_code?: string | null;
  income_class?: string | null;
  province: number | Province;
}

/**
 * Department document from the departments collection
 */
export interface Department extends BaseCMSDocument {
  slug: string;
  office_name: string;
  address?: string | null;
  trunkline?: string | null;
  website?: string | null;
  email?: string | null;
  satellite_office?: string | null;
  public_assistance_desk?: {
    office?: string | null;
    contact?: string | null;
    email?: string | null;
  };
}

/**
 * Bureau document from the bureaus collection
 */
export interface Bureau extends BaseCMSDocument {
  slug: string;
  name: string;
  parent_type: 'departments' | 'executive-offices';
  department?: (number | null) | Department;
  executive_office?: (number | null) | ExecutiveOffice;
  address?: string | null;
  contact?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
}

/**
 * Bureau division document from the bureau-divisions collection
 */
export interface BureauDivision extends BaseCMSDocument {
  slug: string;
  name: string;
  bureau: number | Bureau;
  contact?: string | null;
  email?: string | null;
}

/**
 * Regional office document from the regional-offices collection
 */
export interface RegionalOffice extends BaseCMSDocument {
  slug: string;
  region: string | Region;
  parent_type: 'departments' | 'constitutional-bodies';
  department?: (number | null) | Department;
  constitutional_body?: (number | null) | ConstitutionalBody;
  address?: string | null;
  contact?: string | null;
  email?: string | null;
  phone?: string | null;
}

/**
 * Attached agency document from the attached-agencies collection
 */
export interface AttachedAgency extends BaseCMSDocument {
  slug: string;
  name: string;
  parent_type: 'departments' | 'executive-offices';
  department?: (number | null) | Department;
  executive_office?: (number | null) | ExecutiveOffice;
  address?: string | null;
  trunkline?: string | null;
  contact?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
}

/**
 * Department entity document from the department-entities collection
 */
export interface DepartmentEntity extends BaseCMSDocument {
  slug: string;
  name: string;
  entity_type:
    | 'under_supervision_and_control'
    | 'under_administrative_supervision'
    | 'foreign_service_establishment'
    | 'philippine_mission'
    | 'hospital_medical_center'
    | 'prosecution_service'
    | 'regional_prosecutor_office'
    | 'state_counsel_office'
    | 'collegial_scientific_body'
    | 'research_development_institute'
    | 'scientific_technological_service'
    | 'sectoral_planning_council'
    | 'migrant_workers_office';
  department: number | Department;
  address?: string | null;
  city?: string | null;
  region?: string | null;
  title?: string | null;
  contact?: string | null;
  email?: string | null;
  website?: string | null;
}

/**
 * Executive office document from the executive-offices collection
 */
export interface ExecutiveOffice extends BaseCMSDocument {
  slug: string;
  office: string;
  address?: string | null;
  trunkline?: string | null;
  phone?: string | null;
  website?: string | null;
  email?: string | null;
}

/**
 * Constitutional body document from the constitutional-bodies collection
 */
export interface ConstitutionalBody extends BaseCMSDocument {
  slug: string;
  office_type?: string | null;
  name: string;
  description?: string | null;
  address?: string | null;
  trunklines?:
    | {
        number: string;
        id?: string | null;
      }[]
    | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  region?: string | null;
  satellite_office?: string | null;
  public_assistance_desk?: {
    office?: string | null;
    contact?: string | null;
    email?: string | null;
  };
}

/**
 * Legislative chamber document from the legislative collection
 */
export interface Legislative extends BaseCMSDocument {
  slug: string;
  branch: string;
  chamber: string;
  address?: string | null;
  trunkline?: string | null;
  website?: string | null;
}

/**
 * Committee document from the committees collection
 */
export interface Committee extends BaseCMSDocument {
  slug: string;
  name: string;
  chamber: number | Legislative;
  committee_type?: ('permanent' | 'special' | 'joint') | null;
}

/**
 * Diplomatic mission document from the diplomatic-missions collection
 */
export interface DiplomaticMission extends BaseCMSDocument {
  slug: string;
  type:
    | 'diplomatic_mission'
    | 'honorary_consulates'
    | 'international_organizations';
  country: string;
  office_name: string;
  address?: string | null;
  contact?: string | null;
  email?: string | null;
  website?: string | null;
}

/**
 * Visa category document from the visa-categories collection
 */
export interface VisaCategory extends BaseCMSDocument {
  id_code: string;
  name: string;
  description: string;
}

/**
 * Visa type document from the visa-types collection
 */
export interface VisaType extends BaseCMSDocument {
  visa_id: string;
  name: string;
  category: number | VisaCategory;
  description: string;
  url: string;
  minimumRequirements: {
    requirement: string;
    id?: string | null;
  }[];
  subtypes?:
    | {
        subtype_id: string;
        name: string;
        description: string;
        requirements?:
          | {
              requirement: string;
              id?: string | null;
            }[]
          | null;
        requirementsByRole?: {
          businessOwners?:
            | {
                requirement: string;
                id?: string | null;
              }[]
            | null;
          employees?:
            | {
                requirement: string;
                id?: string | null;
              }[]
            | null;
        };
        id?: string | null;
      }[]
    | null;
}

/**
 * Visa policy document from the visa-policies collection
 */
export interface VisaPolicy extends BaseCMSDocument {
  policy_id: string;
  title: string;
  description: string;
  countries?:
    | {
        country: string;
        id?: string | null;
      }[]
    | null;
  requirements?:
    | {
        requirement: string;
        id?: string | null;
      }[]
    | null;
  additionalInfo?: string | null;
  policyGroups?:
    | {
        group: string;
        policy: string;
        id?: string | null;
      }[]
    | null;
  eligibleGroups?:
    | {
        group: string;
        id?: string | null;
      }[]
    | null;
}

/**
 * Hotline document from the hotlines collection
 */
export interface Hotline extends BaseCMSDocument {
  slug: string;
  name: string;
  category:
    | 'Emergency'
    | 'Disaster'
    | 'Security'
    | 'Transport'
    | 'Weather'
    | 'Utility'
    | 'Social Services';
  contactNumbers?:
    | {
        number: string;
        id?: string | null;
      }[]
    | null;
  description: string;
  featured?: boolean | null;
}

/**
 * Website document from the websites collection
 */
export interface Website extends BaseCMSDocument {
  name: string;
  slug: string;
  type: string;
  website?: string | null;
  email?: string | null;
  address?: string | null;
  contact?: string | null;
  parent_department?: string | null;
}

/**
 * Service category document from the service-categories collection
 */
export interface ServiceCategory extends BaseCMSDocument {
  name: string;
  slug: string;
  icon?: string | null;
  description?: string | null;
}

/**
 * Service subcategory document from the service-subcategories collection
 */
export interface ServiceSubcategory extends BaseCMSDocument {
  name: string;
  slug: string;
  category: number | ServiceCategory;
}

/**
 * Service document from the services collection
 */
export interface Service extends BaseCMSDocument {
  name: string;
  slug: string;
  category: number | ServiceCategory;
  subcategory?: (number | null) | ServiceSubcategory;
  url: string;
  description?: string | null;
  agency?: string | null;
  requirements?:
    | {
        requirement: string;
        id?: string | null;
      }[]
    | null;
  process?:
    | {
        step: string;
        id?: string | null;
      }[]
    | null;
  fees?: string | null;
  processingTime?: string | null;
  where?: string | null;
  contactInfo?: string | null;
  published?: boolean | null;
  featured?: boolean | null;
}
