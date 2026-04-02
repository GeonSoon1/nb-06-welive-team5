import * as s from 'superstruct';
import {
  ExpressRequest,
  ExpressResponse,
  CLEANUP_GRACE_PERIOD_DAYS,
  AWS_REGION,
  S3_BUCKET_NAME,
} from '../libs/constants';
import {
  UpdateStatusBodyStruct,
  AdminIdParamsStruct,
  PasswordBody,
  ChangePasswordBodyStruct,
  UpdateAdminBodyStruct,
} from './user.struct';
import * as userService from './user.services';
import UnauthorizedError from '../libs/errors/UnauthorizedError';
import { catchAsync } from '../libs/catchAsync';
import ValidationError from '../libs/errors/ValidationError';

function encodeS3KeyForUrl(key: string): string {
  return key
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function resolveUploadedImagePath(file?: Express.MulterS3.File): string | null {
  if (!file) return null;

  if (file.location) {
    return file.location;
  }

  const bucket = file.bucket || S3_BUCKET_NAME;
  const key = file.key;

  if (!bucket || !key) {
    return null;
  }

  const regionHost = AWS_REGION === 'us-east-1' ? 's3' : `s3.${AWS_REGION}`;
  const encodedKey = encodeS3KeyForUrl(key);

  return `https://${bucket}.${regionHost}.amazonaws.com/${encodedKey}`;
}

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

  return res.status(200).json({ message: '작업이 성공적으로 완료되었습니다' });
}

/**
 * [통합] PATCH /api/users/me
 * 프로필 이미지 및 비밀번호 조건부 업데이트
 */
export const updateUserProfile = catchAsync(async (req: ExpressRequest, res: ExpressResponse) => {
  // 1. [Security] 인증 미들웨어가 넣어준 유저 정보 확인
  if (!req.user) {
    throw new UnauthorizedError('인증 정보가 없습니다. 다시 로그인해주세요.');
  }
  const userId = req.user.id;

  // 2. [Input] 프론트엔드에서 보낸 데이터 추출
  // MulterS3 미들웨어가 파일이 있으면 req.file에, 없으면 undefined로 둔다.
  const file = req.file as Express.MulterS3.File | undefined;
  
  // 비밀번호 데이터는 Multipart Form의 일반 필드로 들어온다.
  const { currentPassword, newPassword, confirmPassword } = req.body;

  let updateActionTaken = false;
  let successMessage = '';

  // --- 시나리오 A: 비밀번호 변경 로직 ---
  // 입력 필드 중 하나라도 존재한다면 비밀번호 변경 시도로 간주
  if (currentPassword || newPassword || confirmPassword) {
    // [Validation] 프론트엔드에서 1차로 막겠지만, 백엔드에서도 무결성 검증
    if (!currentPassword || !newPassword || !confirmPassword) {
      throw new ValidationError('현재 비밀번호와 새 비밀번호, 비밀번호 확인을 모두 입력해주세요.');
    }

    if (newPassword !== confirmPassword) {
      throw new ValidationError('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.');
    }

    // Superstruct를 이용한 스키마 검증 (길이, 복잡도 등)
    const passwordData = s.create(
      { currentPassword, newPassword }, 
      ChangePasswordBodyStruct
    );

    // 기존 서비스 로직 호출
    await userService.updatePassword(userId, passwordData);
    
    updateActionTaken = true;
    successMessage += '비밀번호가 변경되었습니다.';
    // console.log(`[PROFILE_UPDATE] User ${userId}: Password changed`);
  }

  // --- 시나리오 B: 프로필 이미지 변경 로직 ---
  // S3에 파일이 성공적으로 업로드되어 location URL이 존재하는 경우
  const imagePath = resolveUploadedImagePath(file);
  if (imagePath) {

    // 기존 서비스 로직 호출 (기존 파일 S3 삭제 예약 포함)
    await userService.updateProfileImage(userId, imagePath);
    
    updateActionTaken = true;
    // 비밀번호 메시지가 이미 있다면 줄바꿈 추가
    successMessage += (successMessage ? '\n' : '') + '프로필 이미지가 업데이트되었습니다.';
    // console.log(`[PROFILE_UPDATE] User ${userId}: Image updated to ${imagePath}`);
  }

  // --- 시나리오 C: 아무것도 변경하지 않은 경우 ---
  if (!updateActionTaken) {
    return res.status(400).json({ 
      message: '변경할 프로필 사진이나 비밀번호를 입력해주세요.' 
    });
  }

  // 3. [Output] 최종 결과 반환 (image_1.png의 메시지와 일치)
  // 프론트엔드에서는 이 알림창을 띄운 후 로그아웃 처리를 해야 함
  return res.status(200).json({
    message: '프로필이 성공적으로 수정되었습니다. 다시 로그인해주세요.',
    details: successMessage // 디버깅용 상세 메시지 (선택 사항)
  });
});

/**
 * 현재 로그인 유저의 프로필 이미지 조회.
 * GET /api/users/me/avatar
 */
export const getMyProfileImage = catchAsync(async (req: ExpressRequest, res: ExpressResponse) => {
  if (!req.user) {
    throw new UnauthorizedError('인증 정보가 없습니다. 다시 로그인해주세요.');
  }

  const { body, contentType, cacheControl } = await userService.getProfileImageFile(req.user.id);

  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', cacheControl);

  // AWS SDK 런타임별 Body 타입 차이를 안전하게 처리한다.
  const readableBody = body as NodeJS.ReadableStream & {
    transformToByteArray?: () => Promise<Uint8Array>;
  };

  if (typeof readableBody.pipe === 'function') {
    readableBody.pipe(res);
    return;
  }

  if (typeof readableBody.transformToByteArray === 'function') {
    const bytes = await readableBody.transformToByteArray();
    res.end(Buffer.from(bytes));
    return;
  }

  throw new ValidationError('이미지 데이터를 읽을 수 없습니다.');
});


/**
 * 프로필 이미지 변경.
 */
export async function updateProfileImage(req: ExpressRequest, res: ExpressResponse) {
  // 1. 미들웨어가 넣어준 파일 정보 확인
  const file = req.file as Express.MulterS3.File;
  //location은 multer-s3라는 별도의 확장 도구를 썼을 때만 생기는 특수한 정보
  //그래서 TypeScript에게 '이 파일은 S3가 준 거니까 location이라는 정보가 들어있어'라고 알려주는 과정(as any 또는 as Express.MulterS3.File)이 필요하다.

  // ex) file.location: htts://my-bucket.s3.ap-northeast-2.amazonaws.com/profiles/user-123.png
  const imagePath = resolveUploadedImagePath(file);
  if (!imagePath) {
    return res.status(400).json({ message: '이미지 업로드에 실패했습니다. 다시 시도해주세요.' });
  }

  // 2. 인증 미들웨어(authenticate)가 넣어준 현재 유저 ID
  if (!req.user) {
    throw new UnauthorizedError('인증 정보가 없습니다.');
  }

  const userId = req.user.id;

  const updatedUser = await userService.updateProfileImage(userId, imagePath);

  return res.status(200).json({
    message: `${updatedUser.name}님의 정보가 성공적으로 업데이트되었습니다. 다시 로그인해주세요.`,
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

  // super-admin은 apartmentId = null일듯
  const { role, apartmentId } = req.user;

  await userService.cleanupRejectedUsers({
    requestRole: role, // 요청자
    apartmentId: apartmentId ?? undefined, // ??(왼쪽 값이 null이나 undefined이면 오른쪽 값, 그외 값은 왼쪽 값)
    // days: CLEANUP_GRACE_PERIOD_DAYS,
  });

  return res.status(200).json({
    message: '작업이 성공적으로 완료되었습니다.',
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
