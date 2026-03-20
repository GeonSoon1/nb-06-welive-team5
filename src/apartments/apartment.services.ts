import { Prisma } from '@prisma/client';
import * as apartmentRepository from './apartment.repository';
import { AdminApartmentQuery, PublicApartmentQuery } from './apartment.struct';
import { prismaClient } from '../libs/constants';
import NotFoundError from '../libs/errors/NotFoundError';


/**
 * [공개용/회원가입] 아파트 목록 조회
 */
//ApartmentWhereInput타입 - 아파트 테이블에서 검색할 때 쓸 수 있는 모든 조건 규격
export async function getPublicApartments(filters: PublicApartmentQuery) {
  const { keyword, name, address } = filters;

  const where: Prisma.ApartmentWhereInput = {
    // 통합 검색 (keyword가 있을 때: { OR: [ ... ] } 객체가 where 안으로 쏙(Spread) 들어간다) / true && { OR: [...] }  -->  { OR: [...] }
    ...(keyword && { // 앞이 true면 뒤에 있는 값이 결과값으로 나온다.
      OR: [
        { name: { contains: keyword, mode: 'insensitive' } },
        { address: { contains: keyword, mode: 'insensitive' } },
      ],
    }),
    // 있으면 필터링, 없으면 패스
    name: name ? { contains: name, mode: 'insensitive' } : undefined,
    address: address ? { contains: address, mode: 'insensitive' } : undefined,
  };

  const [apartments, count] = await apartmentRepository.findPublicApartments(prismaClient, where);
  return { apartments, count };
}

/**
 * [슈퍼관리자/관리자] 아파트 목록 조회
 */
export async function getAdminApartments(filters: AdminApartmentQuery) {
  const { searchKeyword, name, address, apartmentStatus, page = 1, limit = 10 } = filters;

  const where: Prisma.ApartmentWhereInput = {
    ...(searchKeyword && {
      OR: [
        { name: { contains: searchKeyword, mode: 'insensitive' } },
        { address: { contains: searchKeyword, mode: 'insensitive' } },
      ],
    }),
    name: name ? { contains: name, mode: 'insensitive' } : undefined,
    address: address ? { contains: address, mode: 'insensitive' } : undefined,
    apartmentStatus: apartmentStatus || undefined,
  };

  const skip = (page - 1) * limit;

  const [rawApartments, totalCount] = await apartmentRepository.findAdminApartments(
    prismaClient,
    where,
    skip,
    limit,
  );

  // 2. 평탄화(Flattening)
  const apartments = rawApartments.map((apt) => {
    
    const { admin, ...rest } = apt;

    return {
      ...rest,
      adminName: admin?.name ?? null,
      adminContact: admin?.contact ?? null,
      adminEmail: admin?.email ?? null,
    };
  });

  return { apartments, totalCount };
}

/**
 * [슈퍼관리자/관리자] 아파트 상세 조회 
 */
export async function getApartmentDetail(apartmentId: string) {

  const rawApartment = await apartmentRepository.findApartmentById(prismaClient, apartmentId);

  if (!rawApartment) {
    throw new NotFoundError('존재하지 않는 아파트 입니다.');
  }

  // admin 객체를 꺼내고 나머지를 rest로 분리
  const { admin, ...rest } = rawApartment;

  const apartment = {
    ...rest,
    adminName: admin?.name ?? null,
    adminContact: admin?.contact ?? null,
    adminEmail: admin?.email ?? null,
    // 필요하다면 기존 admin 객체는 제외
  };

  return apartment;
}

/**
 * [공개용/회원가입] 아파트 기본 정보 상세 조회
 */
export async function getPublicApartmentDetail(id: string) {
  const apartment = await apartmentRepository.findPublicApartmentById(prismaClient, id);

  if (!apartment) {
    throw new NotFoundError('해당 아파트 정보를 찾을 수 없습니다.');
  }

  return apartment;
}