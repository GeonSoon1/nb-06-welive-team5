import { Role } from '@prisma/client';
// Request 객체에는 user라는 필드가 없어서 모든 Request 객체에 user라는 속성을 동적으로 추가
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
        joinStatus: JoinStatus;
        apartmentId: string | null;
      };
    }
  }
}

export { };
