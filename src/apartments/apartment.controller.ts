import { ExpressRequest, ExpressResponse } from '../libs/constants';
import * as apartmentService from './apartment.services';
import * as s from 'superstruct';
import { PublicApartmentQueryStruct } from './apartment.struct';
import { AdminApartmentQueryStruct } from './apartment.struct';
import { ApartmentIdParamsStruct } from './apartment.struct';
import { Role } from '@prisma/client';

/**
 * [통합] 권한별 아파트 목록 조회 분기 처리
 */
export const getApartmentsByRole = async (req: ExpressRequest, res: ExpressResponse) => {
  // 1. [Critical Check] 인증 미들웨어를 통과한 유저의 Role 확인
  const userRole = req.user?.role;

  // 2. [Decision Logic] 관리자 권한(SUPER_ADMIN, ADMIN)인지 확인
  if (userRole === Role.SUPER_ADMIN || userRole === Role.ADMIN) {
    // 관리자라면 기존의 상세 목록 로직 실행
    return getAdminApartments(req, res);
  }

  // 3. 그 외(일반 유저/미승인 유저 등)는 공개 목록 로직 실행
  return getPublicApartments(req, res);
};

/**
 * [공개용/회원가입] 아파트 목록 조회
 */
export async function getPublicApartments(req: ExpressRequest, res: ExpressResponse) {
  const query = s.create(req.query, PublicApartmentQueryStruct);

  const { apartments, count } = await apartmentService.getPublicApartments(query);

  return res.status(200).json({
    apartments,
    count,
  });
}

/**
 * [슈퍼관리자/관리자] 아파트 목록 조회
 */
export async function getAdminApartments(req: ExpressRequest, res: ExpressResponse) {
  // 쿼리 스트링 유효성 검사 (page, limit 등 숫자 변환 포함)
  const query = s.create(req.query, AdminApartmentQueryStruct);

  const { apartments, totalCount } = await apartmentService.getAdminApartments(query);

  return res.status(200).json({
    apartments,
    totalCount,
  });
}


/**
 * [통합] 아파트 상세 정보 조회 분기 처리
 */
export const getApartmentDetailByRole = async (req: ExpressRequest, res: ExpressResponse) => {
  const { id } = s.create(req.params, ApartmentIdParamsStruct);
  const userRole = req.user?.role;

  // 1. 관리자 권한 확인
  if (userRole === Role.SUPER_ADMIN || userRole === Role.ADMIN) {
    const apartment = await apartmentService.getApartmentDetail(id);
    return res.status(200).json(apartment);
  }

  // 2. 일반 유저 또는 비로그인 유저 (Optional Authenticate 적용 시)
  const apartment = await apartmentService.getPublicApartmentDetail(id);
  return res.status(200).json(apartment);
};


/**
 * [슈퍼관리자/관리자] 아파트 상세 조회
 */
export async function getApartmentDetail(req: ExpressRequest, res: ExpressResponse) {
  const { id } = s.create(req.params, ApartmentIdParamsStruct);

  const apartment = await apartmentService.getApartmentDetail(id);

  res.status(200).json(apartment);
}

/**
 * [공개용/회원가입] 아파트 기본 정보 상세 조회
 */
export async function getPublicApartmentDetail(req: ExpressRequest, res: ExpressResponse) {
  const { id } = s.create(req.params, ApartmentIdParamsStruct);

  const apartment = await apartmentService.getPublicApartmentDetail(id);

  res.status(200).json(apartment);
}
