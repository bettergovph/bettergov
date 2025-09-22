import { z } from 'zod';

export const ConstitutionalOfficeSchema = z
  .object({
    name: z.string(),
    office_type: z.string(),
    description: z.string().optional(),
    address: z.string().optional(),
    trunklines: z.array(z.string()).optional(),
    trunk_line: z.string().optional(),
    website: z.string().optional(),
    email: z.string().optional(),
    slug: z.string(),
  })
  .catchall(z.unknown());
