import { HouseHolderStatus, JoinStatus, ResidenceStatus } from '@prisma/client';
import { Prisma } from '../libs/constants';

export type ResidentWithUser = Prisma.ResidentGetPayload<{ include: { user: true } }>;

export interface SignupUserWithNoResident {
  id: string; // userId를 resident 리스트의 식별자로 재사용
  userId: string;
  dong: string;
  ho: string;
  name: string;
  contact: string;
  isHouseholder: HouseHolderStatus;
  residenceStatus: ResidenceStatus;
  user: {
    id: string;
    email: string;
    joinStatus: JoinStatus;
  };
}

export type ResidentListItem = ResidentWithUser | SignupUserWithNoResident;

export interface CsvUploadResult {
  count: number;
}
