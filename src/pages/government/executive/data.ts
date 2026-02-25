import { fetchExecutive } from '../../../lib/cms-data';
import { ExecutiveOfficeSchema } from '../schema';

export async function getExecutiveData() {
  const data = await fetchExecutive();
  return ExecutiveOfficeSchema.array().parse(data);
}
