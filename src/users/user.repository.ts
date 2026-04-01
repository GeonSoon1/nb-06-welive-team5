// src/users/users.repository.ts
import { Prisma, PrismaClient, JoinStatus, ApartmentStatus, Role, User } from '@prisma/client';

// 일반 쿼리와 트랜잭션 쿼리 모두에 대응
export type DbClient = Prisma.TransactionClient | PrismaClient;

export async function findUserIdByUsername(db: DbClient, username: string) {
  return db.user.findUnique({ where: { username }, select: { id: true } });
} //이 유저가 이미 가입되어 있는가?"만 확인하면 돼서 id만 추출.(메모리 절약)

export async function findUserIdByEmail(db: DbClient, email: string) {
  return db.user.findUnique({ where: { email }, select: { id: true } });
}

export async function findUserIdByContact(db: DbClient, contact: string) {
  return db.user.findUnique({ where: { contact }, select: { id: true } });
}

// super-admin이 하나의 admin의 상태를 ex) PENDING -> APPROVED로 승인
export async function updateAdminStatus(db: DbClient, adminId: string, status: ApartmentStatus) {
  // ApartmentStatus에 따른 JoinStatus 매핑
  const joinStatusMap: Record<ApartmentStatus, JoinStatus> = {
    [ApartmentStatus.APPROVED]: JoinStatus.APPROVED,
    [ApartmentStatus.REJECTED]: JoinStatus.REJECTED,
    [ApartmentStatus.PENDING]: JoinStatus.PENDING,
  };
  return db.user.update({
    where: { id: adminId },
    data: {
      joinStatus: joinStatusMap[status], // 매핑된 상태값 사용
      apartment: { update: { apartmentStatus: status as ApartmentStatus } },
    },
  });
}

export async function findUserWithApartmentById(
  db: DbClient,
  userId: string
) {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      apartmentId: true,
    },
  });
}

/**
 * super-admin이 모든 admin의 상태를 ex)PENDING -> APPROVED로 승인
 */
export async function updateAllAdmins(
  db: DbClient,
  params: {
    targetRole: Role;
    fromStatus: ApartmentStatus;
    toStatus: ApartmentStatus;
  },
) {
  // 1. 업데이트할 대상 유저 및 연관된 아파트 ID 조회
  const users = await db.user.findMany({
    where: {
      role: params.targetRole,
      apartment: { apartmentStatus: params.fromStatus },
    },
    select: { id: true, apartmentId: true },
  });

  const userIds = users.map((u) => u.id);
  const apartmentIds = users.map((u) => u.apartmentId).filter((id): id is string => id !== null);

  if (userIds.length === 0) return { count: 0 };
  const joinStatusMap: Record<ApartmentStatus, JoinStatus> = {
    [ApartmentStatus.APPROVED]: JoinStatus.APPROVED,
    [ApartmentStatus.REJECTED]: JoinStatus.REJECTED,
    [ApartmentStatus.PENDING]: JoinStatus.PENDING,
  };
  // 2. 아파트 테이블의 상태를 직접 일괄 업데이트 (updateMany는 중첩 업데이트 미지원)
  if (apartmentIds.length > 0) {

    await db.apartment.updateMany({
      where: { id: { in: apartmentIds } },
      data: {
        apartmentStatus: params.toStatus,
      },
    });
  }

  // 4. 유저 테이블 일괄 업데이트 (JoinStatus 반영)
  return db.user.updateMany({
    where: { id: { in: userIds } },
    data: {
      joinStatus: joinStatusMap[params.toStatus] // 안전하게 매핑된 상태값 적용
    },
  });
}

export async function findUsersByStatus(
  db: DbClient,
  where: { role: Role; apartment: { apartmentStatus: ApartmentStatus; }; }
) {
  return await db.user.findMany({
    where,
    select: { id: true, apartmentId: true },
  });
}

/**
 * 유저의 가입 상태(JoinStatus)를 업데이트.
 */
export async function updateUserStatus(db: DbClient, residentId: string, status: JoinStatus) {
  return await db.user.update({
    where: {
      id: residentId,
    },
    data: {
      joinStatus: status,
    },
  });
}

/**
 * [admin] 일반 유저(user)의 가입 상태를 일괄 변경.
 */
export async function updateAllUsers(
  db: DbClient,
  params: {
    apartmentId: string;
    targetRole: Role;
    fromStatus: JoinStatus;
    toStatus: JoinStatus;
  },
) {
  return db.user.updateMany({
    where: {
      role: params.targetRole,
      joinStatus: params.fromStatus,
      resident: { // user와 연결된 resident가 있으면 가서 resident 테이블과 관계를 맺고 resident 테이블의 apartmentId와 입력한 apartmentId가 같는 것을 조건으로 한다.
        apartmentId: params.apartmentId,
      }
    },
    data: {
      joinStatus: params.toStatus,
    },
  });
}

/**
 * 특정 유저의 Role만 뽑아오는 함수
 */
export async function findUserRoleById(db: DbClient, userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      joinStatus: true,
      image: true,
    },
  });
}

/**
 * 프로필 이미지 조회.
 */
export async function findUserImageById(db: DbClient, userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      image: true,
    },
  });
}

/**
 * 프로필 이미지 변경.
 */
export async function updateImage(db: DbClient, userId: string, imagePath: string) {
  return await db.user.update({
    where: { id: userId },
    data: { image: imagePath },
    select: {
      image: true,
      name: true,
    }
  });
}

/**
 * 삭제할 파일 정보를 기록 (트랜잭션 지원)
 */
export async function reserveFileDeletion(db: DbClient, fileKey: string, reason: string) {
  return await db.deletedFile.create({
    data: {
      fileKey,
      reason,
    },
  });
}

/**
 * 비밀번호 변경을 위해 현재 비밀번호를 추출하는 로직
 */
export async function findUserPasswordById(db: DbClient, userId: string) {
  return await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      password: true,
    },
  });
}

/**
 * 새로운 비밀번호를 DB에 넣어주는 로직
 */
export async function updateUserPassword(db: DbClient, userId: string, password: string) {
  return await db.user.update({
    where: { id: userId },
    data: { password },
    select: {
      id: true,
      name: true
    }
  });
}

/**
 * [Super-Admin] 관리자 정보(아파트 정보) 수정
 */
export async function updateAdminBasicInfo(
  db: DbClient,
  adminId: string,
  data: { name: string; contact: string; email: string; },
): Promise<User> {
  return await db.user.update({
    where: { id: adminId },
    data: {
      name: data.name,
      contact: data.contact,
      email: data.email,
    },
  });
}

/**
 * [Super-Admin/ Admin] Rejected된 관리자들 & 유저들 삭제
 */
export async function findUsersForCleanup(
  db: DbClient,
  where: Prisma.UserWhereInput
) {
  return await db.user.findMany({
    where,
    select: { id: true, apartmentId: true },
  });
}

/**
 * [Repository] 유저 ID 목록으로 일괄 삭제
 */
export async function deleteManyUsersByIds(db: DbClient, userIds: string[]) {
  return await db.user.deleteMany({
    where: { id: { in: userIds } },
  });
}

/**
 * [Repository] 아파트 ID 목록으로 일괄 삭제
 */
export async function deleteManyApartmentsByIds(db: DbClient, aptIds: string[]) {
  return await db.apartment.deleteMany({
    where: { id: { in: aptIds } },
  });
}

/**
 * 특정 Role을 가진 모든 유저를 검색하는 함수
 */
export async function findUsersByRole(db: DbClient, role: Role) {
  return db.user.findMany({
    where: {
      role,
    },
    select: {
      id: true,
    },
  });
}

/**
 * 특정 아파트의 모든 관리자(ADMIN, SUPER_ADMIN)를 검색하는 함수
 */
export async function findAdminsByApartmentId(db: DbClient, apartmentId: string) {
  return db.user.findMany({
    where: {
      apartmentId,
      role: { in: [Role.ADMIN, Role.SUPER_ADMIN] },
    },
    select: {
      id: true,
    },
  });
}

/**
 * 특정 아파트와 특정 Role을 가진 모든 유저를 검색하는 함수
 */
export async function findUsersByApartmentIdAndRole(db: DbClient, apartmentId: string, role: Role) {
  return db.user.findMany({
    where: {
      apartmentId,
      role: role,
    },
    select: {
      id: true,
    },
  });
}

/**
 * [Super-Admin] 관리자 정보(아파트 정보 포함) 삭제
 */
export async function deleteUser(db: DbClient, adminId: string) {
  return await db.user.deleteMany({
    where: { id: adminId },
  });
}
