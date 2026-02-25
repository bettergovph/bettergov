import { fetchConstitutional } from '../../../lib/cms-data';
import { ConstitutionalOfficeSchema, GovernmentOfficeSchema } from '../schema';

export async function getConstitutionalData() {
  const data = await fetchConstitutional();
  return ConstitutionalOfficeSchema.array().parse(data);
}

export async function getInstitutionData() {
  const data = await fetchConstitutional();
  return GovernmentOfficeSchema.array().parse(data);
}
