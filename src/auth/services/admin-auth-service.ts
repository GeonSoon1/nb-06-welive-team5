import { prismaClient } from '../../libs/constants';
import { hashPassword } from '../../libs/auth/password';
import ConflictError from '../../libs/errors/ConflictError';
import { Role, JoinStatus, User, ApartmentStatus, PrismaClient } from '@prisma/client';
import { SignupAdminBody } from '../auth-struct';
import {
  findUserIdByUsername,
  findUserIdByContact,
  findUserIdByEmail,
} from '../../users/users-repository';

export async function signupAdmin(input: SignupAdminBody): Promise<User> {
  // 1. 유저 정보 중복 체크 (ID, Email, Contact)
  const [u1, u2, u3] = await Promise.all([
    findUserIdByUsername(prismaClient, input.username),
    findUserIdByEmail(prismaClient, input.email),
    findUserIdByContact(prismaClient, input.contact),
  ]);

  if (u1 || u2 || u3) {
    throw new ConflictError('이미 사용 중인 정보(아이디, 이메일, 전화번호)입니다');
  }

  // 2. 아파트 중복 신청 체크
  const existingApartment = await prismaClient.apartment.findFirst({
    where: {
      name: input.apartmentName,
      address: input.apartmentAddress,
      officeNumber: input.apartmentManagementNumber,
    },
  });

  if (existingApartment) {
    throw new ConflictError('이미 등록되었거나 신청 진행 중인 아파트 정보입니다.');
  }

  // 3. 비밀번호 해싱
  const hashedPassword = await hashPassword(input.password);

  // 4. 트랜잭션 시작: 아파트와 유저를 원자적(Atomic)으로 생성하네.
  return await prismaClient.$transaction(async (tx) => {
    // A. 아파트 단지 생성
    const apartment = await tx.apartment.create({
      data: {
        name: input.apartmentName,
        address: input.apartmentAddress,
        officeNumber: input.apartmentManagementNumber,
        description: input.description,

        startComplexNumber: parseInt(input.startComplexNumber),
        endComplexNumber: parseInt(input.endComplexNumber),
        startDongNumber: parseInt(input.startDongNumber),
        endDongNumber: parseInt(input.endDongNumber),
        startFloorNumber: parseInt(input.startFloorNumber),
        endFloorNumber: parseInt(input.endFloorNumber),
        startHoNumber: parseInt(input.startHoNumber),
        endHoNumber: parseInt(input.endHoNumber),
        apartmentStatus: ApartmentStatus.PENDING, // 슈퍼 관리자 승인 대기
        apartmentboard: { create: {} }, // 게시판 그룹 자동 생성
      },
    });

    const user = await tx.user.create({
      data: {
        username: input.username,
        password: hashedPassword,
        name: input.name,
        email: input.email,
        contact: input.contact,
        role: Role.ADMIN,
        joinStatus: JoinStatus.PENDING,
        managedApartment: {
          connect: { id: apartment.id },
        },
      },
    });
    return user;
  });
}

export type SignupAdminResponse = Pick<User, 'id' | 'name' | 'email' | 'role' | 'joinStatus'> & {
  isActive: boolean;
};

export function formatAdminResponse(user: User): SignupAdminResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    joinStatus: user.joinStatus,
    isActive: true,
  };
}
