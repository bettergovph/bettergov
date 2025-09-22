import constitutionalJSON from '../../../data/directory/constitutional.json';
import { ConstitutionalOfficeSchema, GovernmentOfficeSchema } from '../schema';

export const constitutionalData =
  ConstitutionalOfficeSchema.array().parse(constitutionalJSON);

export const institutionData =
  GovernmentOfficeSchema.array().parse(constitutionalJSON);
