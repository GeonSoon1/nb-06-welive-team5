import {
  ExpressRequest,
  ExpressResponse,
  ACCESS_TOKEN_COOKIE_NAME
} from '../libs/constants';
import { verifyAccessToken, TokenPayload } from '../libs/auth/token'; // 기존 토큰 유틸 활용
import * as apartmentService from './apartment.services';
import * as s from 'superstruct';
import {
  PublicApartmentQueryStruct,
  AdminApartmentQueryStruct,
  ApartmentIdParamsStruct
} from './apartment.struct';
import { Role } from '@prisma/client';

/**
 * [Helper] 쿠키에서 유저 정보를 안전하게 추출 (any 제거)
 * authenticate.ts의 로직을 참고하여 작성되었습니다.
 */
const getOptionalUser = (req: ExpressRequest): TokenPayload | undefined => {
  try {
    const token = req.cookies[ACCESS_TOKEN_COOKIE_NAME];

    // 토큰이 없으면 에러를 던지지 않고 undefined 반환 (회원가입/공개용 대응)
    if (!token) return undefined;

    // 기존에 정의된 verifyAccessToken 사용
    const payload: TokenPayload = verifyAccessToken(token);
    return payload;
  } catch (err) {
    // 토큰이 변조되었거나 만료된 경우에도 안전하게 undefined 반환
    return undefined;
  }
};

/**
 * [통합] 권한별 아파트 목록 조회 분기 처리
 */
export const getApartmentsByRole = async (req: ExpressRequest, res: ExpressResponse) => {
  const user = getOptionalUser(req);
  const userRole = user?.role;

  // 슈퍼관리자 또는 관리자 권한 확인
  if (userRole === Role.SUPER_ADMIN || userRole === Role.ADMIN) {
    return getAdminApartments(req, res);
  }

  // 그 외(비로그인 포함)는 공개 목록 반환
  return getPublicApartments(req, res);
};

/**
 * [통합] 아파트 상세 정보 조회 분기 처리
 */
export const getApartmentDetailByRole = async (req: ExpressRequest, res: ExpressResponse) => {
  const { id } = s.create(req.params, ApartmentIdParamsStruct);
  const user = getOptionalUser(req);
  const userRole = user?.role;

  if (userRole === Role.SUPER_ADMIN || userRole === Role.ADMIN) {
    const apartment = await apartmentService.getApartmentDetail(id);
    return res.status(200).json(apartment);
  }

  const apartment = await apartmentService.getPublicApartmentDetail(id);
  return res.status(200).json(apartment);
};

/**
 * [공개용/회원가입] 아파트 목록 조회
 */
export async function getPublicApartments(req: ExpressRequest, res: ExpressResponse) {
  const query = s.create(req.query, PublicApartmentQueryStruct);
  const { apartments, count } = await apartmentService.getPublicApartments(query);

  return res.status(200).json({ apartments, count });
}

/**
 * [슈퍼관리자/관리자] 아파트 목록 조회
 */
export async function getAdminApartments(req: ExpressRequest, res: ExpressResponse) {
  const query = s.create(req.query, AdminApartmentQueryStruct);
  const { apartments, totalCount } = await apartmentService.getAdminApartments(query);

  return res.status(200).json({ apartments, totalCount });
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
  res.status(200).json(apartment);
}