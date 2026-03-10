import { prismaClient } from '../libs/constants';
import BadRequestError from '../libs/errors/BadRequestError';
import * as apartmentRepository from './apartment.repository';
/**
 * [1] 아파트 상세 정보 조회 (기존의 start/end 방식 탈피)
 * 슈퍼관리자/관리자용 및 공개용 상세 페이지에서 사용하네.
 */
export async function getApartmentDetail(id: string) {
  const apartment = await apartmentRepository.findApartmentDeailById(prismaClient, id);

  if (!apartment) {
    throw new BadRequestError('존재하지 않는 아파트입니다.');
  }

  return apartment;
}

/**
 * [2] 회원가입용 동/호수 선택 리스트 조회
 * 프론트엔드에서 '동' 선택 시 '호수'가 필터링되는 UI를 위해
 * 데이터를 동(Key)별로 그룹화하여 전달하네.
 */
export async function getApartmentUnitsForSignup(apartmentId: string) {
  const units = await apartmentRepository.findUnitsByApartmentId(prismaClient, apartmentId);

  const groupByDong = units.reduce(
    (acc, unit) => {
      // 1. 우선 값을 꺼내서 변수에 담네. (이때 타입은 배열 | undefined)
      let targetDong = acc[unit.dong];

      // 2. 만약 없다면 빈 배열을 만들고, 원본 객체(acc)에도 넣기.
      if (!targetDong) {
        targetDong = [];
        acc[unit.dong] = targetDong;
      }

      // 3. 이제 targetDong은 무조건 배열(undefined 아님)이라고 TS가 확신
      targetDong.push({
        id: unit.id,
        ho: unit.ho,
      });

      return acc;
    },
    {} as Record<string, { id: string; ho: string }[]>,
  );

  return groupByDong;
}
