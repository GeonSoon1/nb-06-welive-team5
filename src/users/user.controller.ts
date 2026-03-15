import * as s from 'superstruct';
import { ExpressRequest, ExpressResponse } from '../libs/constants';
import {
  UpdateStatusBodyStruct,
  AdminIdParamsStruct,
  PasswordBody,
  ChangePasswordBodyStruct,
} from './user.struct';
import * as userService from './user.services';


/**
 * [슈퍼 관리자] 관리자 가입 상태 변경 (단건)
 * PATCH /api/auth/admins/:adminId/status
 */
export async function updateAdminStatus(req: ExpressRequest, res: ExpressResponse) {
  const { adminId } = s.create(req.params, AdminIdParamsStruct);
  const { status } = s.create(req.body, UpdateStatusBodyStruct);

  await userService.updateAdminStatus(adminId, status);

  return res.status(200).json({ message: '관라자 가입 상태 변경이 완료되었습니다.' });
}


/**
 * [슈퍼 관리자] 관리자 가입 상태 일괄 변경
 * PATCH /api/auth/admins/status
 */
export async function updateAllAdminStatus(req: ExpressRequest, res: ExpressResponse) {
  const { status } = s.create(req.body, UpdateStatusBodyStruct);

  const result = await userService.updateAllAdminStatus(status);

  return res.status(200).json({
    message:
      result.count > 0
        ? '작업이 성공적으로 완료되었습니다.'
        : '변경할 대기 상태의 관리자가 없습니다.',
  });
}

/**
 * 프로필 이미지 변경.
 */
export async function updateProfileImage(req: ExpressRequest, res: ExpressResponse) {
  const file = req.file as Express.MulterS3.File;

  if (!file) {
    return res.status(400).json({ message: '업로드된 파일이 없습니다.' });
  }

  // authenticate를 통과했으니 강제로 req.user!.id 해도 괜찮은지
  const userId = req.user!.id;

  // 저장된 파일 경로(s3 URL)
  const imagePath = file.location;

  await userService.updateProfileImage(userId, imagePath);

  return res.status(200).json({
    message: '프로필 이미지 수정이 완료되었습니다.',
    imageUrl: imagePath,
  });
}


/**
 * 비밀번호 변경.
 */
export async function updatePassword(req: ExpressRequest, res: ExpressResponse) {
  const data: PasswordBody = s.create(req.body, ChangePasswordBodyStruct);

  const userId = req.user!.id;

  await userService.updatePassword(userId, data);

  return res.status(200).json({
    message: '비밀번호 변경이 완료되었습니다. 다시 로그인해주세요.',
  });
}
