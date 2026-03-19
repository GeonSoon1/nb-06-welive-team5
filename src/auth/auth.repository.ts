// src/auth/auth.repository.ts
import { prismaClient } from '../libs/constants';
import { Prisma, PrismaClient, JoinStatus, Role, User } from '@prisma/client';
import { CreateSuperAdminParams, UserWIthApartment } from './auth.type';

export type DbClient = Prisma.TransactionClient | PrismaClient;

export async function createSuperAdmin(db: DbClient, params: CreateSuperAdminParams) {
  return db.user.create({
    data: {
      username: params.username,
      password: params.hashedPassword,
      contact: params.contact,
      name: params.name,
      email: params.email,
      role: Role.SUPER_ADMIN, //Enum이라 Role. 이렇게 값을 꺼낼 수 있음.
      joinStatus: JoinStatus.APPROVED,
    },
    select: {
      id: true,
      name: true,
      email: true,
      joinStatus: true,
      role: true,
    },
  });
}

// 관리자 유저 생성
export async function createAdminUser(
  db: DbClient,
  params: {
    username: string;
    hashedPassword: string;
    name: string;
    email: string;
    contact: string;
    apartmentId: string;
  },
) {
  return db.user.create({
    data: {
      username: params.username,
      password: params.hashedPassword,
      name: params.name,
      email: params.email,
      contact: params.contact,
      role: Role.ADMIN,
      joinStatus: JoinStatus.PENDING,
      apartmentId: params.apartmentId,
    },
  });
}

export async function createUserForSignupUser(
  db: DbClient,
  params: {
    username: string;
    hashedPassword: string;
    contact: string;
    name: string;
    email: string;
    unitId: string;
    apartmentId: string;
    role: Role;
    joinStatus: JoinStatus;
  },
) {
  return db.user.create({
    data: {
      username: params.username,
      password: params.hashedPassword,
      contact: params.contact,
      name: params.name,
      email: params.email,
      role: params.role,
      joinStatus: params.joinStatus,
      apartmentId: params.apartmentId,
      apartmentUnitId: params.unitId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      joinStatus: true,
      role: true,
    },
  });
}

// "단순 조회"가 아니라 "인증 전용 특수 조회"라서 auth.repository.ts에 있어도 됨.
export async function findUserForAuth(username: string): Promise<UserWIthApartment | null> {
  return (await prismaClient.user.findUnique({
    where: { username },
    include: {
      apartment: {
        include: {
          apartmentboard: {
            include: {
              notices: { take: 1, orderBy: { createdAt: 'desc' } },
              complaints: { take: 1, orderBy: { createdAt: 'desc' } },
              votes: { take: 1, orderBy: { createdAt: 'desc' } },
            },
          },
        },
      },
      apartmentUnit: true
    },
  })) as UserWIthApartment | null;
}

export async function findUserById(id: string): Promise<UserWIthApartment | null> {
  return (await prismaClient.user.findUnique({
    where: { id },
    include: {
      apartment: {
        include: {
          apartmentboard: {
            include: {
              notices: { take: 1, orderBy: { createdAt: 'desc' } },
              complaints: { take: 1, orderBy: { createdAt: 'desc' } },
              votes: { take: 1, orderBy: { createdAt: 'desc' } },
            },
          },
        },
      },
      apartmentUnit: true
    },
  })) as UserWIthApartment | null;
}

