import { Role, JoinStatus, ApartmentStatus } from '@prisma/client';
import * as userRepository from './user.repository';
import BadRequestError from '../libs/errors/BadRequestError';
import { prismaClient } from '../libs/constants';
import { verifyPassword, hashPassword } from '../libs/auth/password';
import { PasswordBody, UpdateAdminBody } from './user.struct';
import NotFoundError from '../libs/errors/NotFoundError';
import ValidationError from '../libs/errors/ValidationError';
import * as apartmentRepository from '../apartments/apartment.repository';


/**
 * [super-admin] 특정 관리자(admin)의 가입 상태를 변경.
 */
export async function updateAdminStatus(adminId: string, status: ApartmentStatus) {
  const targetUser = await userRepository.findUserWithApartmentById(prismaClient, adminId);

  if (!targetUser) {
    throw new BadRequestError('해당 유저를 찾을 수 없습니다.');
  }

  if (targetUser.role !== Role.ADMIN) {
    throw new BadRequestError('관리자(ADMIN) 권한을 가진 유저만 승인 상태를 변경할 수 있습니다');
  }

  return await prismaClient.$transaction(async (tx) => {
    await userRepository.updateAdminStatus(tx, adminId, status);

    if (status === ApartmentStatus.APPROVED && targetUser.apartmentId) {
      await apartmentRepository.activateApartment(tx, targetUser.apartmentId, adminId);
    }
  });
}


/**
 * [super-admin] 관리자(admin)의 가입 상태를 일괄 변경.
 */
export async function updateAllAdminStatus(status: ApartmentStatus) {
  // 1. 승인 대기 중인 모든 관리자와 그들의 아파트 ID를 가져오기
  const pendingAdmins = await userRepository.findUsersByStatus(prismaClient, {
    role: Role.ADMIN,
    apartment: { apartmentStatus: ApartmentStatus.PENDING },
  });

  if (pendingAdmins.length === 0) {
    return { count: 0 };
  }

  // 2. 트랜잭션 시작
  return await prismaClient.$transaction(async (tx) => {
    // A. 유저들 상태 일괄 변경
    const updateResult = await userRepository.updateAllAdmins(tx, {
      targetRole: Role.ADMIN,
      fromStatus: ApartmentStatus.PENDING,
      toStatus: status,
    });

    // B. 승인 시에만 연결된 아파트들도 모두 활성화
    if (status === ApartmentStatus.APPROVED) {
      const apartmentIds = pendingAdmins
        .map((admin) => admin.apartmentId)
        .filter((id): id is string => !!id);

      if (apartmentIds.length > 0) {
        // 아파트 테이블 일괄 업데이트
        await apartmentRepository.activateManyApartments(tx, apartmentIds);
      }
    }

    return updateResult;
  });
}


/**
 * 프로필 이미지 변경.
 */
export async function updateProfileImage(userId: string, imagePath: string) {
  // 트랜젝션 작업중 발생한 오류는 500 Server Error로 분류.
  return await prismaClient.$transaction(async (tx) => {
    const user = await userRepository.findUserRoleById(tx, userId);

    // 1. DB에 저장된 값이 있고, 그게 '/public'으로 시작한다면
    if (user?.image && user.image.includes('amazonaws.com')) {

      // htts://bucket.s3.ap-northeast-2.amazonaws.com/1773897003165-169871444.jpg
      // .com/ 뒤쪽만 짤라냄/ fileKey는 파일 이름

      const fileKey = user.image.split('.com/')[1];
      // fileKey = 1773897003165-169871444.jpg

      // 2. 삭제할 파일 deletedFile 테이블에 저장.
      if (fileKey) {
        await userRepository.reserveFileDeletion(
          tx,
          decodeURIComponent(fileKey),
          'USER_PROFILE_UPDATE'
        );
      }
    }

    // 3. User테이블에 새 이미지 업데이트
    const updatedUser = await userRepository.updateImage(tx, userId, imagePath);

    return updatedUser;
  });
}


/**
 * 비밀번호 변경.
 */
export async function updatePassword(userId: string, data: PasswordBody) {
  const { currentPassword, newPassword } = data;

  // DB에서 유저와 기존 해시된 비밀번호를 가져온다.
  const user = await userRepository.findUserPasswordById(prismaClient, userId);

  // 토큰은 살아있지만 관리자에 의해 탈퇴당한 경우 대비 방어적 코드
  if (!user) {
    throw new NotFoundError('사용자를 찾을 수 없습니다.');
  }

  const isMatch = await verifyPassword(currentPassword, user.password);
  if (!isMatch) {
    throw new ValidationError('비밀번호가 일치하지 않습니다.');
  }

  if (currentPassword === newPassword) {
    throw new ValidationError('새 비밀번호는 현재 비밀번호와 동일할 수 없습니다.');
  }

  const hashedNewPassword = await hashPassword(newPassword);

  const updatedUser = await userRepository.updateUserPassword(prismaClient, userId, hashedNewPassword);

  return updatedUser;
}

/**
 * [Super-Admin] 관리자 정보(아파트 정보) 수정
 */
export async function updateAdminInfo(adminId: string, input: UpdateAdminBody) {
  return await prismaClient.$transaction(async (tx) => {
    const user = await userRepository.updateAdminBasicInfo(tx, adminId, {
      name: input.name,
      contact: input.contact,
      email: input.email,
    });

    if (!user) {
      throw new NotFoundError('해당 관리자 정보를 찾을 수 없습니다.');
    }

    if (!user.apartmentId) {
      throw new BadRequestError('해당 관리자 계정에 연결된 아파트 정보가 존재하지 않습니다.');
    }

    const apartment = await apartmentRepository.updateApartmentInfo(tx, user.apartmentId, {
      name: input.apartmentName,
      address: input.apartmentAddress,
      officeNumber: input.apartmentManagementNumber,
      description: input.description,
    });

    return {
      ...user,
      apartment: apartment,
    };
  });
}

/**
 * [Super-Admin/ Admin] Rejected된 관리자들 & 유저들 삭제
 */
export async function cleanupRejectedUsers(params: {
  requestRole: Role;
  apartmentId?: string;
  // days: number;
}) {
  // 오늘 날짜 기준으로 3일 전 날짜
  // const thresholdDate = subDays(new Date(), params.days);

  const targetRole = params.requestRole === Role.SUPER_ADMIN ? Role.ADMIN : Role.USER;

  if (params.requestRole === Role.ADMIN && !params.apartmentId) {
    throw new BadRequestError('아파트 정보가 없습니다.');
  }

  // 2. 트랜잭션 시작 
  return await prismaClient.$transaction(async (tx) => {

    // A. 삭제 대상 조회 (Repository 활용)
    const targetUsers = await userRepository.findUsersForCleanup(tx, {
      role: targetRole,
      joinStatus: JoinStatus.REJECTED,
      ...(params.apartmentId && { apartmentId: params.apartmentId }),
    });

    if (targetUsers.length === 0) return { count: 0 };

    const userIds = targetUsers.map((u) => u.id);
    const aptIds = targetUsers
      .map((u) => u.apartmentId)
      .filter((id): id is string => !!id);

    // B. 비즈니스 로직: 관리자 삭제 시 아파트도 삭제
    if (targetRole === Role.ADMIN && aptIds.length > 0) {
      await userRepository.deleteManyApartmentsByIds(tx, aptIds);
    }

    // C. 최종 유저 삭제 (Repository 활용)
    return await userRepository.deleteManyUsersByIds(tx, userIds);
  });

}

/**
 * [Super-Admin] 관리자 정보(아파트 정보 포함) 삭제
 */
export async function removeAdminAndAssociatedData(adminId: string) {
  return await prismaClient.$transaction(async (tx) => {
    const apartment = await apartmentRepository.findApartmentByAdminId(tx, adminId);

    if (apartment) {
      await apartmentRepository.removeApartment(tx, apartment.id);
    }

    await userRepository.deleteUser(tx, adminId);
  });
}