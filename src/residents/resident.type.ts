import { Prisma } from '../libs/constants';
import { ResidenceStatus } from '@prisma/client';

export type ResidentWithUser = Prisma.ResidentGetPayload<{ include: { user: true } }>;

export interface GetResidentsQuery {
  page?: string;
  limit?: string;
  building?: string;
  unitNumber?: string;
  residenceStatus?: ResidenceStatus;
  isRegistered?: string;
  keyword?: string;
}

export interface CsvUploadResult {
  count: number;
}
