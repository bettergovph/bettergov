import { executiveOffices as executiveJSON } from '../../../data/cms';
import { ExecutiveOfficeSchema } from '../schema';

export const executiveData = ExecutiveOfficeSchema.array().parse(executiveJSON);
