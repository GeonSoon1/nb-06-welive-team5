import { Role, JoinStatus } from '@prisma/client';
import * as userRepository from './user.repository';
import BadRequestError from '../libs/errors/BadRequestError';
import { prismaClient } from '../libs/constants';

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
