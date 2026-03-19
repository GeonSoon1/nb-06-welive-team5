// src/apartments/apartments.repository.ts
import {
  Prisma,
  PrismaClient,
  Apartment,
  ApartmentUnit,
  ApartmentStructureGroup,
} from '@prisma/client';

export type DbClient = Prisma.TransactionClient | PrismaClient;

/**
 * 1. [관리자용] 상세 정보 타입 정의
 */
type ApartmentWithRelations = Prisma.ApartmentGetPayload<{
  include: {
    structureGroups: {
      select: {
        id: true;
        dongList: true;
        startFloor: true;
        maxFloor: true;
        unitsPerFloor: true;
      };
    };
    admin: {
      select: {
        id: true;
        name: true;
        email: true;
        contact: true;
      };
    };
  };
}>;

export type FlatApartmentResponse = Omit<ApartmentWithRelations, 'admin'> & {
  adminId: string | null;
  adminName: string | null;
  adminContact: string | null;
  adminEmail: string | null;
};

/**
 * 2. [공개용] 상세 정보 타입 정의
 */
export type PublicApartmentDetail = Prisma.ApartmentGetPayload<{
  select: {
    id: true,
    name: true,
    address: true,
    structureGroups: {
      select: {
        dongList: true,
        startFloor: true,
        maxFloor: true,
        unitsPerFloor: true
      };
    };
  };
}>;

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

/**
 * [공개용] 아파트 목록 및 전체 개수 조회
 * 트랜잭션이 필요 없는 단순 조회이므로 prismaClient를 직접 사용.
 */
export async function findPublicApartments(
  db: DbClient,
  where: Prisma.ApartmentWhereInput,
): Promise<[Pick<Apartment, 'id' | 'name' | 'address'>[], number]> {

  const approvedWhere: Prisma.ApartmentWhereInput = {
    ...where,
    apartmentStatus: 'APPROVED', 
  }

  return Promise.all([
    db.apartment.findMany({
      where: approvedWhere,
      select: {
        id: true,
        name: true,
        address: true,
      },
      orderBy: { name: 'asc' }, // 가나다순 정렬
    }),
    db.apartment.count({ where: approvedWhere }),
  ]);
}

/**
 * [관리자용] 페이징이 포함된 상세 목록 조회
 */
export async function findAdminApartments(
  db: DbClient,
  where: Prisma.ApartmentWhereInput,
  skip: number,
  take: number,
): Promise<[
  (Apartment & { 
    structureGroups: Pick<ApartmentStructureGroup, 'dongList' | 'startFloor' | 'maxFloor' | 'unitsPerFloor'>[] 
  })[], 
  number
]> {
  return Promise.all([
    db.apartment.findMany({
      where,
      skip,
      take, 
      // 필요한 관계 모델을 명시적으로 포함(include)
      include: {
        structureGroups: {
          select: {
            dongList: true,
            startFloor: true,
            maxFloor: true,
            unitsPerFloor: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' }, // 최신 등록순
    }),
    db.apartment.count({ where }),
  ]);
}

/**
 * [관리자용] apartmentId로 아파트 상세 정보 조회
 */
// Apartment 기본 필드에 우리가 추가할 admin 필드들을 결합.
export async function findApartmentById(
  db: DbClient,
  id: string,
): Promise<FlatApartmentResponse | null> {
  
  const apartment = await db.apartment.findUnique({
    where: { id },
    include: {
      structureGroups: true,
      admin: true,
    },
  });

  if (!apartment) return null;

  const { admin, ...rest } = apartment;

  // 원하는 순서대로 객체를 재조립
  return {
    id: rest.id,
    name: rest.name,
    address: rest.address,
    officeNumber: rest.officeNumber,
    description: rest.description,
    createdAt: rest.createdAt,
    updatedAt: rest.updatedAt,
    apartmentStatus: rest.apartmentStatus,
    ApartmentboardId: rest.ApartmentboardId,
    
    // [관리자 정보] 
    adminId: rest.adminId, 
    adminName: admin?.name ?? null,
    adminContact: admin?.contact ?? null,
    adminEmail: admin?.email ?? null,

    structureGroups: rest.structureGroups,
  };
}

/**
 * [공개용] apartmentId로 아파트 상세 정보 조회
 */
export async function findPublicApartmentById(
  db: DbClient,
  id: string
): Promise<PublicApartmentDetail | null> {
  return db.apartment.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      address: true,
      structureGroups: {
        select: {
          dongList: true,
          startFloor: true,
          maxFloor: true,
          unitsPerFloor: true,
        },
      },
    },
  });
}

/**
 * [Super-Admin] 아파트 정보(관리자 정보) 수정
 */
export async function updateApartmentInfo(
  db: DbClient,
  apartmentId: string,
  data: {
    name: string;
    address: string;
    officeNumber: string;
    description: string;
  }
): Promise<Apartment> {
  return await db.apartment.update({
    where: { id: apartmentId },
    data: {
      name: data.name,
      address: data.address,
      officeNumber: data.officeNumber,
      description: data.description,
    },
  });
}

/**
 * [Super-Admin] 관리자 정보(아파트 정보 포함) 삭제
 */
export async function findApartmentByAdminId(db: DbClient, adminId: string) {
  return await db.apartment.findUnique({
    where: { adminId },
    select: { id: true },
  });
}

export async function removeApartment(db: DbClient, apartmentId: string) {
  return await db.apartment.delete({
    where: { id: apartmentId },
  });
}

/**
 * 아파트를 승인 상태로 변경하고, 관리자를 주인으로 등록한다.
 */
export async function activateApartment(db: DbClient, apartmentId: string, adminId: string) {
  return db.apartment.update({
    where: { id: apartmentId },
    data: {
      apartmentStatus: 'APPROVED',
      adminId: adminId,
    },
  });
}