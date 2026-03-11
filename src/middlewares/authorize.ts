import { ExpressRequest, ExpressResponse, ExpressNextFunction } from "../libs/constants";
import { Role, JoinStatus } from "@prisma/client";
import ForbiddenError from "../libs/errors/ForbiddenError";
import UnauthorizedError from "../libs/errors/UnauthorizedError";


export function authorize(...allowedRoles: Role[]) {
  return function (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) {
    //1. 인증 정보 확인
    if (!req.user) {
      return next(new UnauthorizedError('인증 정보가 없습니다.'))
    }

    //2.Role이 아무리 높더라도 APPROVED 상태가 아니면 통과할 수 없게
    //Super-admin은 처음부터 APPROVED라 괜찮다.
    if (req.user.role !== Role.SUPER_ADMIN && req.user.joinStatus !== JoinStatus.APPROVED) {
      return next(new ForbiddenError(`현재 가입 상태(${req.user.joinStatus})로는 이 작업을 수행할 수 없습니다. 승인을 기다려주세요.`));
    }
    // super-admin이 로그인 했다면 allowedRoles도 ['SUPER-ADMIN]이고 req.user.role도 super-admin이 되서 true가 된다. 
    // ['SUPER_ADMIN'].includes('SUPER_ADMIN')
    if (!allowedRoles.includes(req.user.role as Role)) {
      return next(new ForbiddenError('해당 작업을 수행할 권한이 없습니다.'))
    }

    next();
  };
}
// ...allowedRoles: Role[] -> ['SUPER_ADMIN']