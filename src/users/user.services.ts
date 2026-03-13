import { Role, JoinStatus } from '@prisma/client';
import * as userRepository from './user.repository';
import BadRequestError from '../libs/errors/BadRequestError';
import { prismaClient, S3_BUCKET_NAME } from '../libs/constants';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../libs/s3Client';

/**
 * [admin] 일반 주민(USER)의 가입 상태를 변경.
 */
export async function updateUserStatus(residentId: string, status: JoinStatus) {
  //1. 대상 유저의 역할 확인
  const targetUser = await userRepository.findUserRoleById(prismaClient, residentId);

  if (!targetUser) {
    throw new BadRequestError('해당 유저를 찾을 수 없습니다.');
  }

  // 2.대상이 반드시 일반 주민(USER)이어야 한다.
  // 관리자가 다른 관리자나 최고 관리자의 상태를 여기서 바꾸면 보안 사고
  if (targetUser.role !== Role.USER) {
    throw new BadRequestError(
      '일반 주민(USER) 권한을 가진 유저만 승인 상태로 변경할 수 있습니다. ',
    );
  }
  // 3. 상태 업데이트 실행
  return await userRepository.updateUserStatus(prismaClient, residentId, status);
}

/**
 * [super-admin] 관리자(admin)의 가입 상태를 변경.
 */
export async function updateAdminStatus(adminId: string, status: JoinStatus) {
  const targetUser = await userRepository.findUserRoleById(prismaClient, adminId);

  if (!targetUser) {
    throw new BadRequestError('해당 유저를 찾을 수 없습니다.');
  }

  if (targetUser.role !== Role.ADMIN) {
    throw new BadRequestError('관리자(ADMIN) 권한을 가진 유저만 승인 상태를 변경할 수 있습니다');
  }

  return await userRepository.updateAdminStatus(prismaClient, adminId, status);
}

/**
 * 프로필 이미지 변경.
 */
export async function updateProfileImage(userId: string, imagePath: string) {
  const user = await userRepository.findUserRoleById(prismaClient, userId);

  // 1. DB에 저장된 값이 있고, 그게 '/public'으로 시작한다면
  if (user?.image && user.image.includes('amazonaws.com')) {
    try { // .com/ 뒤쪽만 짤라냄/ fileKey는 파일 이름
      const fileKey = user.image.split('.com/')[1];

      if (fileKey) {
        await s3Client.send(new DeleteObjectCommand({
          Bucket: S3_BUCKET_NAME,
          Key: decodeURIComponent(fileKey),
        }));
        console.log("기존 S3 파일 삭제 완료:", fileKey);
      }
    } catch (err) {
      console.error("기존 S3 파일 삭제 중 오류 발생:", err);
    }
  }

  return await userRepository.updateImage(prismaClient, userId, imagePath);
}