import { constitutionalOffices } from '../../../data/cms';
import { ConstitutionalOfficeSchema, GovernmentOfficeSchema } from '../schema';

export const constitutionalData = ConstitutionalOfficeSchema.array().parse(
  constitutionalOffices
);

export const institutionData = GovernmentOfficeSchema.array().parse(
  constitutionalOffices
);
