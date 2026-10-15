import executiveJSON from '../../../data/directory/executive.json';
import { ExecutiveOfficeSchema } from '../schema';

export const executiveData = ExecutiveOfficeSchema.array().parse(executiveJSON);
