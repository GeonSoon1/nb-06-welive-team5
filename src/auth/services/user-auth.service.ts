// src/auth/services/user-auth.service.ts
import { prismaClient } from '../../libs/constants';
import { hashPassword } from '../../libs/auth/password';
import BadRequestError from '../../libs/errors/BadRequestError';
import ConflictError from '../../libs/errors/ConflictError';
import { JoinStatus, Role, User } from '@prisma/client';

import { findApartmentIdByName } from '../../apartments/apartments.repository';
import {
  findUserIdByUsername,
  findUserIdByEmail,
  findUserIdByContact,
  createUserForSignupUser,
} from '../../users/users.repository';
import {
  findResidentForAutoApprove,
  linkResidentToUser,
} from '../../residents/resident.repository';

export type SignupUserResponse = Pick<User, 'id' | 'name' | 'email' | 'role' | 'joinStatus'> & {
  isActive: boolean;
};

type SignupUserInput = {
  username: string;
  password: string;
  contact: string;
  name: string;
  email: string;
  role?: 'SUPER_ADMIN' | 'ADMIN' | 'USER'; // 서버에서 무시
  apartmentName: string;
  apartmentDong: string;
  apartmentHo: string;
};

export async function signupUser(input: SignupUserInput): Promise<SignupUserResponse> {
  // 1) 아파트 존재 확인
  const apartment = await findApartmentIdByName(prismaClient, input.apartmentName);
  if (!apartment) throw new BadRequestError('입력한 아파트가 존재하지 않습니다.');

  // 2) 중복 체크
  const [u1, u2, u3] = await Promise.all([
    findUserIdByUsername(prismaClient, input.username),
    findUserIdByEmail(prismaClient, input.email),
    findUserIdByContact(prismaClient, input.contact),
  ]);

  if (u1 || u2 || u3) {
    throw new ConflictError('이미 사용 중인 정보(아이디, 이메일, 전화번호)입니다.');
  }

  // 3) 비밀번호 해싱
  const hashedPassword = await hashPassword(input.password);

  // 4) 트랜잭션: (명부 확인 -> 유저 생성 -> 명부 연결)
  return prismaClient.$transaction(async (tx) => {
    const resident = await findResidentForAutoApprove(tx, {
      apartmentId: apartment.id,
      dong: input.apartmentDong,
      ho: input.apartmentHo,
      name: input.name,
      contact: input.contact,
    });

    // 입주민 명부에는 존재하고(진짜 우리 주민이고), 아직 가입한 적이 없는 깨끗한 데이터인가?
    const shouldAutoApprove = resident !== null && resident.userId == null;

    const user = await createUserForSignupUser(tx, {
      username: input.username,
      hashedPassword,
      contact: input.contact,
      name: input.name,
      email: input.email,
      apartmentId: apartment.id,
      dong: input.apartmentDong,
      ho: input.apartmentHo,
      role: Role.USER, // 서버 강제
      joinStatus: shouldAutoApprove ? JoinStatus.APPROVED : JoinStatus.PENDING,
    });
    // 현재 명부에 없으면 유저는 생성하되 joinStatus = PENDING 유지

    // 자동 승인 대상이 맞고(true), 명부 데이터(resident)가 실제로 존재할 때 (한번 더 확인)
    if (shouldAutoApprove && resident) {
      await linkResidentToUser(tx, {
        residentId: resident.id,
        userId: user.id,
      });
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      joinStatus: user.joinStatus,
      isActive: true,
      role: user.role,
    };
  });
}
