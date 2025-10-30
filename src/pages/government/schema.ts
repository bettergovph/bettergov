import { z } from 'zod';

const PersonnelSchema = z.object({
  name: z.string(),
  contact: z.string().optional(),
  email: z.string().optional(),
  role: z.string(),
  other_office: z.string().optional(),
});

const OfficeDivisionSchema = z.object({
  office_division: z.string(),
  personnel: z.array(PersonnelSchema),
});

export const ExecutiveOfficeSchema = z.object({
  office: z.string(),
  address: z.string().optional(),
  trunkline: z.string().optional(),
  website: z.string().optional(),
  email: z.string().optional(),
  officials: z
    .array(z.union([PersonnelSchema, OfficeDivisionSchema]))
    .optional(),
  bureaus: z.array(z.unknown()).optional(),
  attached_agency: z.array(z.unknown()).optional(),
});

export const GovernmentOfficeSchema = z
  .object({
    name: z.string(),
    office_type: z.string(),
    description: z.string().optional(),
    address: z.string().optional(),
    trunklines: z.array(z.string()).optional(),
    trunk_line: z.string().optional(),
    website: z.string().optional(),
    email: z.string().optional(),
    officials: z.array(PersonnelSchema).optional(),
    phone: z.string().optional(),
    slug: z.string().optional(),
  })
  .catchall(z.unknown());

export const ConstitutionalOfficeSchema = GovernmentOfficeSchema.extend({
  slug: z.string(), // Required for constitutional offices
  officials: PersonnelSchema.array(), // Required for constitutional offices
});

export type ConstitutionalOffice = z.infer<typeof ConstitutionalOfficeSchema>;
