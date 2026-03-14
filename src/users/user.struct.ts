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
// 승인 상태 변경
// --------------------
export const UpdateStatusBodyStruct = s.object({
  status: s.enums(['APPROVED', 'REJECTED']),
});

export type PasswordBody = s.Infer<typeof ChangePasswordBodyStruct>

// --------------------
// 비밀번호 변경
// --------------------
export const ChangePasswordBodyStruct = s.object({
  currentPassword: s.string(), // 이미 가입한 유저 고려.
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

// 공통으로 쓸 ID 검증 로직
const Id = s.nonempty(s.string())

export const AdminIdParamsStruct = s.object({
  adminId: Id, // 여기서 adminId는 반드시 있어야 함을 명시하지
});

export const UserIdParamsStruct = s.object({
  residentId: Id, // 여기서 userId는 반드시 있어야 함을 명시하지
});