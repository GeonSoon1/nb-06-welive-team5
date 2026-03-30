import { Prisma } from '@prisma/client';
import * as apartmentRepository from './apartment.repository';
import { AdminApartmentQuery, PublicApartmentQuery } from './apartment.struct';
import { prismaClient } from '../libs/constants';
import NotFoundError from '../libs/errors/NotFoundError';
/**
 * structureGroups 데이터를 받아서 프론트엔드가 요구하는 동/호수 매핑 데이터로 변환
 */
function parseStructureGroupsToRanges(structureGroups: any[]) {
  let minDong = Infinity;
  let maxDong = -Infinity;
  let minFloor = Infinity;
  let maxFloor = -Infinity;
  let maxHo = 1;

  if (structureGroups && structureGroups.length > 0) {
    structureGroups.forEach((sg) => {
      const dongNumbers = (sg.dongList?.match(/\d+/g) || []).map(Number);
      if (dongNumbers.length > 0) {
        minDong = Math.min(minDong, ...dongNumbers);
        maxDong = Math.max(maxDong, ...dongNumbers);
      }
      minFloor = Math.min(minFloor, sg.startFloor);
      maxFloor = Math.max(maxFloor, sg.maxFloor);
      maxHo = Math.max(maxHo, sg.unitsPerFloor);
    });
  }

  if (minDong === Infinity) minDong = 1;
  if (maxDong === -Infinity) maxDong = 1;
  if (minFloor === Infinity) minFloor = 1;
  if (maxFloor === -Infinity) maxFloor = 1;

  let startComplex = '1';
  let startDongNum = minDong.toString();
  let endComplex = '1';
  let endDongNum = maxDong.toString();

  if (minDong >= 100) {
    startComplex = Math.floor(minDong / 100).toString();
    startDongNum = (minDong % 100).toString();
  }
  if (maxDong >= 100) {
    endComplex = Math.floor(maxDong / 100).toString();
    endDongNum = (maxDong % 100).toString();
  }

  const hoRangeStart = `${minFloor}01`;
  const hoRangeEnd = `${maxFloor}${String(maxHo).padStart(2, '0')}`;

  return {
    startComplexNumber: startComplex,
    endComplexNumber: endComplex,
    startDongNumber: startDongNum,
    endDongNumber: endDongNum,
    startFloorNumber: minFloor.toString(),
    endFloorNumber: maxFloor.toString(),
    startHoNumber: '1',
    endHoNumber: maxHo.toString(),
    dongRange: { start: minDong.toString(), end: maxDong.toString() },
    hoRange: { start: hoRangeStart, end: hoRangeEnd },
  };
}

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

  // 평탄화 및 구조 파싱 적용
  const apartments = rawApartments.map((apt) => {
    // structureGroups를 추출하고, 나머지를 rest에 담음
    const { admin, structureGroups, ...rest } = apt;

    // 유틸 함수로 동/호수 데이터 계산
    const ranges = parseStructureGroupsToRanges(structureGroups);

    return {
      ...rest,
      ...ranges, // 계산된 범위 데이터 병합
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

  const { admin, structureGroups, ...rest } = rawApartment;

  // 유틸 함수로 동/호수 데이터 계산
  const ranges = parseStructureGroupsToRanges(structureGroups);

  const apartment = {
    ...rest,
    ...ranges, // 계산된 범위 데이터 병합
    adminName: admin?.name ?? null,
    adminContact: admin?.contact ?? null,
    adminEmail: admin?.email ?? null,
  };

  return apartment;
}

// /**
//  * [공개용/회원가입] 아파트 기본 정보 상세 조회
//  */
// export async function getPublicApartmentDetail(id: string) {
//   const apartment = await apartmentRepository.findPublicApartmentById(prismaClient, id);

//   if (!apartment) {
//     throw new NotFoundError('해당 아파트 정보를 찾을 수 없습니다.');
//   }

//   return apartment;
// }

/**
 * [공개용/회원가입] 아파트 기본 정보 상세 조회
 */
export async function getPublicApartmentDetail(id: string) {
  const apartment = await apartmentRepository.findPublicApartmentById(prismaClient, id);

  if (!apartment) {
    throw new NotFoundError('해당 아파트 정보를 찾을 수 없습니다.');
  }

  const { structureGroups, ...rest } = apartment;

  // 새로 만든 유틸 함수 사용
  const ranges = parseStructureGroupsToRanges(structureGroups);

  return {
    id: rest.id,
    name: rest.name,
    address: rest.address,
    ...ranges,
  };
}