import { prismaClient } from '../../libs/constants';
import { hashPassword } from '../../libs/auth/password';
import ConflictError from '../../libs/errors/ConflictError';
import { Role, JoinStatus, User } from '@prisma/client';
import { SignupSuperAdminBody } from '../auth-struct';
import {
  findUserIdByUsername,
  findUserIdByEmail,
  findUserIdByContact,
} from '../../users/users-repository';

export async function signupSuperAdmin(input: SignupSuperAdminBody): Promise<User> {
  const [u1, u2, u3] = await Promise.all([
    findUserIdByUsername(prismaClient, input.username),
    findUserIdByEmail(prismaClient, input.email),
    findUserIdByContact(prismaClient, input.contact),
  ]);

  if (u1 || u2 || u3) {
    throw new ConflictError('이미 사용 중인 정보(아이디, 이메일, 전화번호)입니다.');
  }

  const hashedPassword = await hashPassword(input.password);

  return await prismaClient.user.create({
    data: {
      username: input.username,
      password: hashedPassword,
      name: input.name,
      email: input.email,
      contact: input.contact,
      role: Role.SUPER_ADMIN,
      joinStatus: JoinStatus.APPROVED,
    },
  });
}

export type SignupSuperAdminResponse = Pick<
  User,
  'id' | 'name' | 'email' | 'role' | 'joinStatus'
> & { isActive: boolean };

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
