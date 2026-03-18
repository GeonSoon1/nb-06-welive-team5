// src/users/users.repository.ts
import { Prisma, PrismaClient, JoinStatus, Role, User } from '@prisma/client';

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
export async function updateAdminStatus(db: DbClient, adminId: string, status: JoinStatus) {
  return db.user.update({
    where: { id: adminId },
    data: { joinStatus: status },
  });
}

/**
 * super-admin이 모든 admin의 상태를 ex)PENDING -> APPROVED로 승인
 */
export async function updateAllAdmins(
  db: DbClient,
  params: { 
    targetRole: Role; 
    fromStatus: JoinStatus; 
    toStatus: JoinStatus; 
  },
) {
  return db.user.updateMany({
    where: {
      role: params.targetRole,
      joinStatus: params.fromStatus,
    },
    data: {
      joinStatus: params.toStatus,
    },
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

// 특정 유저의 Role만 뽑아오는 함수
export async function findUserRoleById(db: DbClient, id: string) {
  return db.user.findUnique({
    where: { id },
    select: {
      role: true,
      joinStatus: true,
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
export async function cleanupRejectedUsers(
  db: DbClient,
  params: {
    targetRole: Role;
    updatedBefore: Date;
    apartmentId?: string;
  }
): Promise<Prisma.BatchPayload> {
  return await db.user.deleteMany({ // deleteMany는 db 작업 진행하고 count를 return함.
    where: {
      role: params.targetRole,
      joinStatus: JoinStatus.REJECTED,
      updatedAt: {
        lt: params.updatedBefore // '기준 날짜보다 이전' 조건
      }, 
      // apartmentId가 있으면 apartmentId는 params.apartmentId 넣기. (앞에 값이 undefined이면 falsy라서 undefiend 반환)
      ...(params.apartmentId && { apartmentId: params.apartmentId }), 
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