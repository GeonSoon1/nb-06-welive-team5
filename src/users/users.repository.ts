// src/users/users.repository.ts
import { Prisma, PrismaClient, JoinStatus, Role } from '@prisma/client';

export type DbClient = Prisma.TransactionClient | PrismaClient;

export async function findUserIdByUsername(db: DbClient, username: string) {
  return db.user.findUnique({ where: { username }, select: { id: true } });
}

export async function findUserIdByEmail(db: DbClient, email: string) {
  return db.user.findUnique({ where: { email }, select: { id: true } });
}

export async function findUserIdByContact(db: DbClient, contact: string) {
  return db.user.findUnique({ where: { contact }, select: { id: true } });
}

export async function createUserForSignupUser(
  db: DbClient,
  params: {
    username: string;
    hashedPassword: string;
    contact: string;
    name: string;
    email: string;
    apartmentId: string;
    dong: string;
    ho: string;
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
      apartmentId: params.apartmentId,
      dong: params.dong,
      ho: params.ho,
      role: params.role,
      joinStatus: params.joinStatus,
    },
    select: { id: true, name: true, email: true, joinStatus: true, role: true },
  });
}