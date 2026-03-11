import { ComplaintStatus } from '@prisma/client';

export interface GetComplaintsQuery {
  page?: string;
  limit?: string;
  status?: ComplaintStatus;
  isPublic?: string;
  dong?: string;
  ho?: string;
  keyword?: string;
}
