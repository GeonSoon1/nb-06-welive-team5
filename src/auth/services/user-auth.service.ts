// src/auth/services/user-auth.service.ts
import { prismaClient } from '../../libs/constants';
import { hashPassword } from '../../libs/auth/password';
import BadRequestError from '../../libs/errors/BadRequestError';
import ConflictError from '../../libs/errors/ConflictError';
import { JoinStatus, Role, User } from '@prisma/client';
import { SignupUserBody } from '../auth.struct';

import * as apartmentRepository from '../../apartments/apartment.repository';
import * as userRepository from '../../users/user.repository';
import * as residentRepository from '../../residents/resident.repository';
import * as authRepository from '../auth.repository';
import { SignupUserResponse } from '../auth.type';

export async function signupUser(input: SignupUserBody): Promise<SignupUserResponse> {
  // 1) 중복 체크
  const [u1, u2, u3] = await Promise.all([
    userRepository.findUserIdByUsername(prismaClient, input.username),
    userRepository.findUserIdByEmail(prismaClient, input.email),
    userRepository.findUserIdByContact(prismaClient, input.contact),
  ]);

  if (u1 || u2 || u3)
    throw new ConflictError('이미 사용 중인 정보(아이디, 이메일, 전화번호)입니다.');

  // 2) 비밀번호 해싱
  const hashedPassword = await hashPassword(input.password);

  // 3) 트랜잭션: (명부 확인 -> 유저 생성 -> 명부 연결)
  return prismaClient.$transaction(async (tx) => {
    // 1. 유저가 가입할 때 선택한 "101동 101호"가 우리 DB(아파트 유닛 테이블)에 등록된 진짜 집인지 확인
    const unitInfo = await apartmentRepository.findUnitInfoById(tx, input.unitId);
    if (!unitInfo) throw new BadRequestError('존재하지 않는 아파트 유닛 정보입니다.');

    // 2. 명부에 존재하는지 확인
    const resident = await residentRepository.findResidentForAutoApprove(tx, {
      apartmentId: unitInfo.apartmentId,
      dong: unitInfo.dong,
      ho: unitInfo.ho,
      name: input.name,
      contact: input.contact,
    });

    // 입주민 명부에는 존재하고(진짜 우리 주민이고), 아직 가입한 적이 없는 깨끗한 데이터인가?
    const shouldAutoApprove = resident !== null && resident.userId == null;

    const user = await authRepository.createUserForSignupUser(tx, {
      username: input.username,
      hashedPassword,
      contact: input.contact,
      name: input.name,
      email: input.email,
      unitId: input.unitId,
      apartmentId: unitInfo.apartmentId,
      role: Role.USER, // 서버 강제
      joinStatus: shouldAutoApprove ? JoinStatus.APPROVED : JoinStatus.PENDING,
    });
    // 현재 명부에 없으면 유저는 생성하되 joinStatus = PENDING 유지

    // 자동 승인 대상이 맞고(true), 명부 데이터(resident)가 실제로 존재할 때
    // Resident 테이블(명부)에 비어있던 userId 칸에 방금 가입한 유저의 ID를 넣어 주는 작업.
    if (shouldAutoApprove && resident) {
      await residentRepository.linkResidentToUser(tx, {
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
