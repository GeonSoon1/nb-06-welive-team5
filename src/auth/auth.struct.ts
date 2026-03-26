// src/auth/auth.struct.ts
import * as s from 'superstruct';
import isEmail from 'is-email';
import { MAX_BATCH_UNIT_LIMIT } from '../libs/constants';

// 공통: trim + nonempty
const trimmed = s.coerce(s.string(), s.string(), (v) => v.trim());

// 공통 필드
export const UsernameStruct = s.nonempty(
  s.coerce(s.size(s.string(), 5, 30), s.string(), (v) => v.trim()),
);

export const PasswordStruct = s.nonempty(
  s.refine(
    s.size(s.string(), 8, 128),
    'PasswordPolicy',
    (value) => /[A-Za-z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value),
  ),
);

export const ContactStruct = s.nonempty(
  s.refine(
    s.coerce(s.string(), s.string(), (v) => v.trim()),
    'PhoneNumber',
    (v) => /^010\d{7,8}$/.test(v),
  ),
);

export const NameStruct = s.nonempty(
  s.coerce(s.size(s.string(), 1, 30), s.string(), (v) => v.trim()),
);

export const EmailStruct = s.nonempty(
  s.refine(
    s.size(
      s.coerce(s.string(), s.string(), (v) => v.trim().toLowerCase()),
      5,
      254
    ),
    'Email',
    (value) => isEmail(value),
  ),
);

// enums (스웨거 기준)
export const RoleStruct = s.enums(['SUPER_ADMIN', 'ADMIN', 'USER']);
export const JoinStatusStruct = s.enums(['PENDING', 'APPROVED', 'REJECTED', 'NEED_UPDATE']);

// --------------------
// USER 회원가입
// --------------------
export const SignupUserBodyStruct = s.object({
  // [1] 유저 기본 정보 (사진 왼쪽 섹션)
  username: UsernameStruct,
  password: PasswordStruct,
  name: NameStruct,
  email: EmailStruct,
  contact: ContactStruct,
  unitId: s.nonempty(s.string()),
});

export type SignupUserBody = s.Infer<typeof SignupUserBodyStruct>;

// --------------------
// ADMIN 회원가입
// --------------------
export const ApartmentStructureGroupStruct = s.refine(
  s.object({
    dongList: s.refine(s.nonempty(trimmed), 'MaxDongCount', (value) => {
      const dongs = value.split(',').map((d) => d.trim()).filter(Boolean);
      return dongs.length <= 25;
    }),
    startFloor: s.defaulted(s.size(s.integer(), 1, 30), 1),
    maxFloor: s.size(s.integer(), 1, 30),
    unitsPerFloor: s.size(s.integer(), 1, 25),
  }),
  'MaxTotalUnits',
  (value) => {
    const dongCount = value.dongList.split(',').filter(Boolean).length;
    const floorCount = value.maxFloor - value.startFloor + 1;
    const totalUnits = dongCount * floorCount * value.unitsPerFloor;

    // 1만 세대 초과 시 false 리턴 -> StructError 발생
    return totalUnits <= MAX_BATCH_UNIT_LIMIT;
  }
);

export const SignupAdminBodyStruct = s.object({
  username: UsernameStruct,
  password: PasswordStruct,
  contact: ContactStruct,
  name: NameStruct,
  email: EmailStruct,
  description: s.nonempty(trimmed),

  structureGroups: s.array(ApartmentStructureGroupStruct),

  role: s.optional(RoleStruct),
  apartmentName: s.nonempty(trimmed),
  apartmentAddress: s.nonempty(trimmed),
  apartmentManagementNumber: s.nonempty(trimmed),
});

// s.Infer는 "내가 만든 검증 설계도(Struct)를 보고, 그에 딱 맞는 TypeScript 타입을 자동으로 추출.
export type SignupAdminBody = s.Infer<typeof SignupAdminBodyStruct>;

// --------------------
// SUPER_ADMIN 회원가입
// --------------------
export const SignupSuperAdminBodyStruct = s.object({
  username: UsernameStruct,
  password: PasswordStruct,
  contact: ContactStruct,
  name: NameStruct,
  email: EmailStruct,

  role: s.optional(RoleStruct),
  joinStatus: s.optional(JoinStatusStruct), // 서버에서 기본 APPROVED로 덮어씀
});

export type SignupSuperAdminBody = s.Infer<typeof SignupSuperAdminBodyStruct>;

// --------------------
// 로그인
// --------------------
export const LoginBodyStruct = s.object({
  username: UsernameStruct,
  //password: PasswordStruct, 기존 좌측 코드로 할 경우 반환 값에 사용자가 입력한 비밀번호가 포함이되어서 보안 이슈 우려
  //로그인시에는 단순히 빈 문자열인지만 체크 하는 코드로 변경
  password: s.nonempty(s.string()),
});
