import { ExpressRequest, ExpressResponse } from '../libs/constants';
import * as apartmentService from './apartment.services';
import * as s from 'superstruct';
import { PublicApartmentQueryStruct } from './apartment.struct';
import { AdminApartmentQueryStruct } from './apartment.struct';
import { ApartmentIdParamsStruct } from './apartment.struct';

/**
 * [GET] /api/apartments/public
 * 공개용 아파트 목록 검색 (회원가입 시 아파트 찾기 용도)
 */
export async function getPublicApartments(req: ExpressRequest, res: ExpressResponse) {
  const query = s.create(req.query, PublicApartmentQueryStruct);

  const { apartments, count } = await apartmentService.getPublicApartments(query);

  return res.status(200).json({
    message: '아파트 목록 조회 성공(공개)',
    apartments,
    count,
  });
}

/**
 * [GET] api/apartments
 * 관리자용 아파트 목록 조회 (페이징, 상세 필터 포함)
 */
export async function getAdminApartments(req: ExpressRequest, res: ExpressResponse) {
  // 쿼리 스트링 유효성 검사 (page, limit 등 숫자 변환 포함)
  const query = s.create(req.query, AdminApartmentQueryStruct);

  const { apartments, totalCount, page, limit } = await apartmentService.getAdminApartments(query);

  return res.status(200).json({
    message: '아파트 목록 조회 성공(관리자)',
    apartments,
    totalCount,
    page,
    limit,
  });
}

// /**
//  * [GET] api/apartments/:apartmentId
//  * 관리자용 아파트 상세 조회 
//  */
export async function getApartmentDetail(req: ExpressRequest, res: ExpressResponse) {
  const { id } = s.create(req.params, ApartmentIdParamsStruct);

  const apartment = await apartmentService.getApartmentDetail(id);

  res.status(200).json({
    message: '아파트 상세 조회 성공',
    apartment,
  });
}

// /**
//  * [GET] api/apartments/public/:apartmentId
//  * 공개용 아파트 상세 조회 
//  */
export async function getPublicApartmentDetail(req: ExpressRequest, res: ExpressResponse) {
  const { id } = s.create(req.params, ApartmentIdParamsStruct);

  const apartment = await apartmentService.getPublicApartmentDetail(id);

  res.status(200).json({
    message: '공개용 아파트 상세 조회 성공',
    apartment,
  })
}