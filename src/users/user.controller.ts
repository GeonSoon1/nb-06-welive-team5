import * as s from 'superstruct';
import { ExpressRequest, ExpressResponse, CLEANUP_GRACE_PERIOD_DAYS } from '../libs/constants';
import {
  UpdateStatusBodyStruct,
  AdminIdParamsStruct,
  PasswordBody,
  ChangePasswordBodyStruct,
  UpdateAdminBodyStruct,
} from './user.struct';
import * as userService from './user.services';
import UnauthorizedError from '../libs/errors/UnauthorizedError';


/**
 * [슈퍼 관리자] 관리자 가입 상태 변경 (단건)
 * PATCH /api/auth/admins/:adminId/status
 */
export async function updateAdminStatus(req: ExpressRequest, res: ExpressResponse) {
  const { adminId } = s.create(req.params, AdminIdParamsStruct);
  const { status } = s.create(req.body, UpdateStatusBodyStruct);

  await userService.updateAdminStatus(adminId, status);

  return res.status(200).json({ message: '작업이 성공적으로 완료되었습니다' });
}


/**
 * [슈퍼 관리자] 관리자 가입 상태 일괄 변경
 * PATCH /api/auth/admins/status
 */
export async function updateAllAdminStatus(req: ExpressRequest, res: ExpressResponse) {
  const { status } = s.create(req.body, UpdateStatusBodyStruct);

  await userService.updateAllAdminStatus(status);

  return res.status(200).json({ message: '작업이 성공적으로 완료되었습니다'});
}

/**
 * 프로필 이미지 변경.
 */
export async function updateProfileImage(req: ExpressRequest, res: ExpressResponse) {
  // 1. 미들웨어가 넣어준 파일 정보 확인
  const file = req.file as Express.MulterS3.File;
  //location은 multer-s3라는 별도의 확장 도구를 썼을 때만 생기는 특수한 정보
  //그래서 TypeScript에게 '이 파일은 S3가 준 거니까 location이라는 정보가 들어있어'라고 알려주는 과정(as any 또는 as Express.MulterS3.File)이 필요하다.

  // ex) file.location: htts://my-bucket.s3.ap-northeast-2.amazonaws.com/profiles/user-123.png
  if (!file || !file.location) {
    return res.status(400).json({ message: '이미지 업로드에 실패했습니다. 다시 시도해주세요.' });
  }

  // 2. 인증 미들웨어(authenticate)가 넣어준 현재 유저 ID
  if (!req.user) {
    throw new UnauthorizedError('인증 정보가 없습니다.');
  }

  const userId = req.user.id;

  // 2. 저장된 파일 경로(S3 URL)
  const imagePath = file.location;

  const updatedUser = await userService.updateProfileImage(userId, imagePath);

  return res.status(200).json({
    message: `${updatedUser.name}님의 정보가 성공적으로 업데이트되었습니다. 다시 로그인해주세요.`
  });
}


/**
 * 비밀번호 변경.
 */
export async function updatePassword(req: ExpressRequest, res: ExpressResponse) {
  const data: PasswordBody = s.create(req.body, ChangePasswordBodyStruct);

  if (!req.user) {
    throw new UnauthorizedError('인증 정보가 없습니다.');
  }

  const userId = req.user.id;

  const updatedUser = await userService.updatePassword(userId, data);

  return res.status(200).json({
    message: `${updatedUser.name}님의 비밀번호가 변경되었습니다. 다시 로그인해주세요.`,
  });
}

/**
 * [Super-Admin] 관리자 정보(아파트 정보) 수정
 */
export async function updateAdminInfo(req: ExpressRequest, res: ExpressResponse) {
  const { adminId } = s.create(req.params, AdminIdParamsStruct);

  const payload = s.create(req.body, UpdateAdminBodyStruct);

  await userService.updateAdminInfo(adminId, payload);

  return res.status(200).json({
    message: '작업이 성공적으로 완료되었습니다',
  });
}

/**
 * [Super-Admin/ Admin] Rejected된 관리자들 & 유저들 삭제
 */
export async function cleanupRejectedUsers(req: ExpressRequest, res: ExpressResponse) {
  if (!req.user) {
    throw new UnauthorizedError('인증 정보가 없습니다');
  }

  const { role, apartmentId } = req.user;

  await userService.cleanupRejectedUsers({
    requestRole: role,
    apartmentId: apartmentId ?? undefined, // ??(왼쪽 값이 null이나 undefined이면 오른쪽 값, 그외 값은 왼쪽 값)
    // days: CLEANUP_GRACE_PERIOD_DAYS,
  });

  return res.status(200).json({
    message: '작업이 성공적으로 완료되었습니다.'
  });
}

/**
 * [Super-Admin] 관리자 정보(아파트 정보 포함) 삭제
 */
export async function deleteAdminAccount(req: ExpressRequest, res: ExpressResponse) {
  const { adminId } = s.create(req.params, AdminIdParamsStruct);

  await userService.removeAdminAndAssociatedData(adminId);

  return res.status(200).json({
    message: '작업이 성공적으로 완료되었습니다',
  });
}