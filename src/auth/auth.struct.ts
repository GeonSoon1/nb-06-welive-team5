// src/auth/auth.struct.ts
import * as s from 'superstruct';
import isEmail from 'is-email';

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
  username: UsernameStruct,
  password: PasswordStruct,
  contact: ContactStruct,
  name: NameStruct,
  email: EmailStruct,

  // 스웨거에는 role이 있지만, 서버에서 무시할 거라 optional로 둠
  role: s.optional(RoleStruct),

  apartmentName: s.nonempty(trimmed),
  apartmentDong: s.nonempty(trimmed),
  apartmentHo: s.nonempty(trimmed),
});

// --------------------
// ADMIN 회원가입
// --------------------
export const SignupAdminBodyStruct = s.object({
  username: UsernameStruct,
  password: PasswordStruct,
  contact: ContactStruct,
  name: NameStruct,
  email: EmailStruct,

  description: s.nonempty(trimmed),

  // 스웨거가 string 예시라 string으로 받고 service에서 number로 변환 추천
  startComplexNumber: s.nonempty(trimmed),
  endComplexNumber: s.nonempty(trimmed),
  startDongNumber: s.nonempty(trimmed),
  endDongNumber: s.nonempty(trimmed),
  startFloorNumber: s.nonempty(trimmed),
  endFloorNumber: s.nonempty(trimmed),
  startHoNumber: s.nonempty(trimmed),
  endHoNumber: s.nonempty(trimmed),

  role: s.optional(RoleStruct),

  apartmentName: s.nonempty(trimmed),
  apartmentAddress: s.nonempty(trimmed),
  apartmentManagementNumber: s.nonempty(trimmed),
});

export type SignupAdminBody = s.Infer<typeof SignupAdminBodyStruct>

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

export type SignupSuperAdminBody = s.Infer<typeof SignupSuperAdminBodyStruct>

// --------------------
// 로그인
// --------------------
export const LoginBodyStruct = s.object({
  username: UsernameStruct,
  password: PasswordStruct,
});

// --------------------
// 승인 상태 변경
// --------------------
export const UpdateStatusBodyStruct = s.object({
  status: s.enums(['APPROVED', 'REJECTED']),
});

// --------------------
// 비밀번호 변경
// --------------------
export const ChangePasswordBodyStruct = s.object({
  currentPassword: PasswordStruct,
  newPassword: PasswordStruct,
});

// 업데이트 dto는 partial로 (나중에 트랜젝션 해야한다.)
// contact, name, email은 User테이블 / apartment테이블 섞여있어서.
export const UpdateAdminBodyStruct = s.partial(
  s.object({
    contact: ContactStruct,
    name: NameStruct,
    email: EmailStruct,
    description: s.nonempty(trimmed),
    apartmentName: s.nonempty(trimmed),
    apartmentAddress: s.nonempty(trimmed),
    apartmentManagementNumber: s.nonempty(trimmed),
  }),
);
