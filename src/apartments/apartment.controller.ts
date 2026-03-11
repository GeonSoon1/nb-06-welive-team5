import BadRequestError from '../libs/errors/BadRequestError';
import { ExpressRequest, ExpressResponse } from '../libs/constants';
import * as apartmentService from './apartment.services';
import * as s from 'superstruct';
import { IdParamsStruct } from './apartment.struct';

/**
 * [GET] /api/apartments/:id/units-for-signup
 * 회원가입 시 동/호수 선택을 위한 그룹화된 목록 조회
 */
export async function getApartmentUnitsForSignup(req: ExpressRequest, res: ExpressResponse) {
  const { id } = s.create(req.params, IdParamsStruct); // 아파트 UUID

  // 우리가 아까 짠 '동별 그룹화 서비스' 호출
  const groupedUnits = await apartmentService.getApartmentUnitsForSignup(id);

  return res.status(200).json({
    message: '회원가입용 유닛 목록 조회 성공',
    unitsByDong: groupedUnits, // { "101": [...], "103": [...] } 형태
  });
}
