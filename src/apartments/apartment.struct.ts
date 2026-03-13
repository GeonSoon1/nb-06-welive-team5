import * as s from 'superstruct';

// 쿼리 스트링 문자열을 숫자로 변환해주는 커스텀 타입
const NumberCoerce = s.coerce(s.number(), s.string(), (v) => Number(v));

// 공개용 쿼리 (Public)
export const PublicApartmentQueryStruct = s.object({
  keyword: s.optional(s.string()),
  name: s.optional(s.string()),
  address: s.optional(s.string()),
});

export type PublicApartmentQuery = s.Infer<typeof PublicApartmentQueryStruct>;

// 관리자용 쿼리 (Admin)
export const AdminApartmentQueryStruct = s.object({
  name: s.optional(s.string()),
  address: s.optional(s.string()),
  searchKeyword: s.optional(s.string()),
  apartmentStatus: s.optional(s.enums(['PENDING', 'APPROVED', 'REJECTED'])),
  page: s.optional(NumberCoerce),
  limit: s.optional(NumberCoerce),
});

export type AdminApartmentQuery = s.Infer<typeof AdminApartmentQueryStruct>;

// 공통으로 쓸 ID 검증 로직
const Id = s.nonempty(s.string())

export const ApartmentIdParamsStruct = s.object({
  id: Id, // 여기서 adminId는 반드시 있어야 함을 명시하지
});