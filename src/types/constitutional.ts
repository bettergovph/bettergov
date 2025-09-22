import { z } from 'zod';
import { ConstitutionalOfficeSchema } from './schema';

export { ConstitutionalOfficeSchema } from './schema';
export type ConstitutionalOffice = z.infer<typeof ConstitutionalOfficeSchema>;
