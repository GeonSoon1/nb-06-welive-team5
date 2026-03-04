// src/apartments/apartments.repository.ts
import { Prisma, PrismaClient } from '@prisma/client';
import { prismaClient } from '../libs/constants';

export type DbClient = Prisma.TransactionClient | PrismaClient;

export async function findApartmentIdByName(db: DbClient, name: string) {
  return db.apartment.findFirst({
    where: { name },
    select: { id: true },
  });
}
