// src/apartments/apartments.repository.ts
import {
  Prisma,
  PrismaClient,
  Apartment,
  ApartmentUnit,
  ApartmentStructureGroup,
} from '@prisma/client';
import { prismaClient } from '../libs/constants';

export type DbClient = Prisma.TransactionClient | PrismaClient;

/**
 * [1] 아파트 기본 정보 생성
 */
export async function createApartment(
  db: DbClient,
  data: Omit<Prisma.ApartmentCreateInput, 'apartmentboard'>,
): Promise<Apartment> {
  return db.apartment.create({
    data: {
      ...data,
      apartmentboard: { create: {} },
    },
  });
}

/**
 * [2] 동별 구조 설정 저장
 */
export async function createStructureGroup(
  db: DbClient,
  data: Prisma.ApartmentStructureGroupCreateInput,
): Promise<ApartmentStructureGroup> {
  return db.apartmentStructureGroup.create({ data });
}

/**
 * [3] 유닛 대량 삽입
 * createMany는 **Prisma.BatchPayload**라는 타입을 반환한다. 여기에는 오직 하나, count 필드만 들어있다.
 */
export async function createManyUnits(
  db: DbClient,
  unitData: Prisma.ApartmentUnitCreateManyInput[],
): Promise<Prisma.BatchPayload> {
  // 명령이 잘 수행되었다고 count만 return하게 만듦.
  return db.apartmentUnit.createMany({ data: unitData });
}

/**
 * [4] 중복 아파트 등록 체크
 */
export async function findExistingApartment(
  db: DbClient,
  name: string,
  address: string,
  officeNumber: string,
): Promise<Apartment | null> {
  return db.apartment.findFirst({
    where: { name, address, officeNumber },
  });
}

export async function findApartmentIdByName(
  db: DbClient,
  name: string,
): Promise<{ id: string } | null> {
  return db.apartment.findFirst({
    where: { name },
    select: { id: true },
  });
}

// 밑에서 쓰려고 새로 타입 정의
export type ApartmentWithStructure = Prisma.ApartmentGetPayload<{
  include: { structureGroups: true };
}>;

export async function findApartmentDeailById(
  db: DbClient,
  id: string,
): Promise<ApartmentWithStructure | null> {
  return db.apartment.findUnique({
    where: { id },
    include: {
      structureGroups: true,
    },
  });
}

export async function findUnitsByApartmentId(
  db: DbClient,
  apartmentId: string,
): Promise<Pick<ApartmentUnit, 'id' | 'dong' | 'ho'>[]> {
  return db.apartmentUnit.findMany({
    where: {
      apartmentId,
      isActive: true,
    },
    orderBy: [{ dong: 'asc' }, { ho: 'asc' }],
    select: {
      id: true,
      dong: true,
      ho: true,
    },
  });
}

/**
 * unitId(UUID)를 실제 텍스트 정보(dong, ho)로 변환
 * 서비스 레이어에서 이 정보를 이용해 '입주민 명부'와 대조
 */
export async function findUnitInfoById(
  db: DbClient,
  id: string,
): Promise<Pick<ApartmentUnit, 'apartmentId' | 'dong' | 'ho'> | null> {
  return db.apartmentUnit.findUnique({
    where: { id },
    select: {
      apartmentId: true,
      dong: true,
      ho: true,
    },
  });
}
