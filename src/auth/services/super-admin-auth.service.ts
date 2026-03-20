import { prismaClient } from '../../libs/constants';
import { hashPassword } from '../../libs/auth/password';
import ConflictError from '../../libs/errors/ConflictError';
import { User } from '@prisma/client';
import { SignupSuperAdminBody } from '../auth.struct';
import * as userRepository from '../../users/user.repository';
import * as authRepository from '../auth.repository';
import { SignupSuperAdminResponse } from '../auth.type';

export async function signupSuperAdmin(input: SignupSuperAdminBody): Promise<User> {
  const [u1, u2, u3] = await Promise.all([
    userRepository.findUserIdByUsername(prismaClient, input.username),
    userRepository.findUserIdByEmail(prismaClient, input.email),
    userRepository.findUserIdByContact(prismaClient, input.contact),
  ]);

  if (u1 || u2 || u3) {
    throw new ConflictError('이미 사용 중인 정보(아이디, 이메일, 전화번호)입니다.');
  }

  const hashedPassword = await hashPassword(input.password);

  return (await authRepository.createSuperAdmin(prismaClient, {
    username: input.username,
    hashedPassword: hashedPassword,
    name: input.name,
    email: input.email,
    contact: input.contact,
  })) as User;
}

export function formatSuperAdminResponse(user: User): SignupSuperAdminResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    joinStatus: user.joinStatus,
    isActive: true,
  };
}
