import * as s from 'superstruct';
import { ExpressRequest, ExpressResponse } from '../libs/constants';
import { 
  UpdateStatusBodyStruct,
  AdminIdParamsStruct,
  UserIdParamsStruct,
} from './user.struct';
import * as userAuthService from './user.services';

  
/**
 * [슈퍼 관리자] 관리자 가입 상태 변경 (단건)
 * PATCH /api/auth/admins/:adminId/status
 */
export async function updateAdminStatus(req: ExpressRequest, res: ExpressResponse) {
  const { adminId } = s.create(req.params, AdminIdParamsStruct);
  const { status } = s.create(req.body, UpdateStatusBodyStruct)

  await userAuthService.updateAdminStatus(adminId, status);

  return res.status(200).json({ message: '관라자 가입 상태 변경이 완료되었습니다.' })

}

/**
 * [Admin] 주민 가입 상태 변경 (단건)
 */
export async function updateUserStatus(req: ExpressRequest, res: ExpressResponse) {
  // 1. URL 파라미터에서 대상 주민(USER) ID 추출
  const { residentId } = s.create(req.params, UserIdParamsStruct);

  // 2. 바디 데이터 검증
  const { status } = s.create(req.body, UpdateStatusBodyStruct) 

  // 3. 서비스 호출
  await userAuthService.updateUserStatus(residentId, status);

  return res.status(200).json({ message: '주민 가입 상태 변경이 완료되었습니다.'})
}