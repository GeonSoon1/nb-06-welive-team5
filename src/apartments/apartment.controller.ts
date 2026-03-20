import { ExpressRequest, ExpressResponse } from '../libs/constants';
import * as apartmentService from './apartment.services';
import * as s from 'superstruct';
import { PublicApartmentQueryStruct } from './apartment.struct';
import { AdminApartmentQueryStruct } from './apartment.struct';
import { ApartmentIdParamsStruct } from './apartment.struct';

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

  res.status(200).json(apartment)
}