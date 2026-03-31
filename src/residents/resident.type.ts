import { Prisma } from '../libs/constants';

export type ResidentWithUser = Prisma.ResidentGetPayload<{ include: { user: true } }>;

export interface CsvUploadResult {
  count: number;
}
