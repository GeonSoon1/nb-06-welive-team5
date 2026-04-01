import { HouseHolderStatus, JoinStatus, PrismaClient, ResidenceStatus, Role } from '@prisma/client'; // 건순님
import { prismaClient as prisma, Prisma } from '../libs/constants';
import { CreateResidentDto, UpdateResidentDto, GetResidentsQueryDto } from './resident.struct';
import { SignupUserWithNoResident } from './resident.type';

// 1. 입주민 리소스 생성(개별 등록)
export async function createResident(apartmentId: string, data: CreateResidentDto) {
  return await prisma.resident.create({
    data: {
      apartmentId: apartmentId,
      name: data.name,
      dong: data.building,
      ho: data.unitNumber,
      contact: data.contact,
      isHouseholder: data.isHouseholder,
      residenceStatus: 'RESIDENCE',
    },
    include: { user: true },
  });
}

// 2. 조회
export async function findResidentsByApartment(
  apartmentId: string,
  query: GetResidentsQueryDto = {},
) {
  const { page, limit, building, unitNumber, residenceStatus, keyword, isRegistered } = query;

  const take = Math.min(Number(limit || 20), 100);
  const skip = (Math.max(Number(page || 1), 1) - 1) * take;

  const where: Prisma.ResidentWhereInput = {
    apartmentId,
    ...(building && { dong: building }),
    ...(unitNumber && { ho: unitNumber }),
    ...(residenceStatus && { residenceStatus }),
    ...(isRegistered === 'true' && { userId: { not: null } }),
    ...(isRegistered === 'false' && { userId: null }),
    ...(keyword && {
      OR: [{ name: { contains: keyword } }, { contact: { contains: keyword } }],
    }),
  };

  const [residents, totalCount] = await Promise.all([
    prisma.resident.findMany({
      where,
      skip,
      take,
      include: { user: true },
    }),
    prisma.resident.count({ where }),
  ]);

  return { residents, totalCount };
}

/**
 * resident 테이블과 연결되지 않은 가입 유저(User)를
 * 관리자 입주민 승인 화면에서 함께 노출하기 위한 조회.
 */
export async function findSignupUsersWithoutResidentByApartment(
  apartmentId: string,
  query: GetResidentsQueryDto = {},
): Promise<SignupUserWithNoResident[]> {
  const { building, unitNumber, keyword } = query;

  const users = await prisma.user.findMany({
    where: {
      apartmentId,
      role: Role.USER,
      joinStatus: JoinStatus.PENDING,
      resident: null,
      ...(keyword && {
        OR: [
          { name: { contains: keyword } },
          { contact: { contains: keyword } },
          { email: { contains: keyword } },
          { username: { contains: keyword } },
        ],
      }),
      ...((building || unitNumber) && {
        apartmentUnit: {
          ...(building && { dong: building }),
          ...(unitNumber && { ho: unitNumber }),
        },
      }),
    },
    select: {
      id: true,
      name: true,
      contact: true,
      email: true,
      joinStatus: true,
      apartmentUnit: {
        select: {
          dong: true,
          ho: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return users.map((user) => ({
    id: user.id,
    userId: user.id,
    dong: user.apartmentUnit?.dong ?? '',
    ho: user.apartmentUnit?.ho ?? '',
    name: user.name,
    contact: user.contact,
    isHouseholder: HouseHolderStatus.MEMBER,
    residenceStatus: ResidenceStatus.NO_RESIDENCE,
    user: {
      id: user.id,
      email: user.email,
      joinStatus: user.joinStatus,
    },
  }));
}

// 3. 입주민 상세조회
export async function findResidentById(id: string) {
  return await prisma.resident.findUnique({
    where: { id },
    include: { user: true },
  });
}

// 4. 입주민 정보 수정
export async function updateResident(id: string, data: UpdateResidentDto) {
  return await prisma.resident.update({
    where: { id },
    data: {
      name: data.name,
      dong: data.building,
      ho: data.unitNumber,
      contact: data.contact,
      isHouseholder: data.isHouseholder,
    },
    include: { user: true },
  });
}

// 5. 입주민 삭제
export async function deleteResident(id: string) {
  const resident = await prisma.resident.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (resident?.userId) {
    return await prisma.$transaction([
      prisma.resident.delete({ where: { id } }),
      prisma.user.delete({ where: { id: resident.userId } }),
    ]);
  }

  return await prisma.resident.delete({
    where: { id },
  });
}

// 6. 입주민 생성 (CSV 업로드용)
export async function createManyResidents(data: Prisma.ResidentCreateManyInput[]) {
  return await prisma.resident.createMany({
    data: data,
    skipDuplicates: true,
  });
}

// src/residents/residents.repository.ts (건순)
export type DbClient = Prisma.TransactionClient | PrismaClient;

export async function findResidentForAutoApprove(
  db: DbClient,
  params: {
    apartmentId: string;
    dong: string;
    ho: string;
    name: string;
    contact: string;
  },
) {
  // 조건이 모두 일치(AND 조건)하는 첫 번째 데이터를 찾아오라는 뜻이라네.
  return db.resident.findFirst({
    where: {
      apartmentId: params.apartmentId,
      dong: params.dong,
      ho: params.ho,
      name: params.name,
      contact: params.contact,
    },
    select: { id: true, userId: true },
  });
}

export async function linkResidentToUser(
  db: DbClient,
  params: {
    residentId: string;
    userId: string;
    residenceStatus?: ResidenceStatus;
  },
) {
  return db.resident.update({
    where: { id: params.residentId },
    data: {
      userId: params.userId,
      residenceStatus: params.residenceStatus ?? ResidenceStatus.RESIDENCE, //기본값은 거주중
    }, // ?? - 왼쪽 값이 없으면(null 또는 undefined), 오른쪽 값을 써라.
  });
}

// 입주민 (user) 상태 변경 (건순)
export async function findResidentWithAuthInfo(db: DbClient, residentId: string) {
  return await db.resident.findUnique({
    where: { id: residentId },
    select: {
      apartmentId: true,
      userId: true,
      user: { // DB에서 User 테이블이랑 JOIN 해서 그 안에 있는 구체적인 정보 가져오기.
        select: {
          role: true,
          joinStatus: true, // User 테이블에 있는 상태값
        }
      }
    }
  }); 
}
