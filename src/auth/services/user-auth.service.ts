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
import { sendNotificationToUser } from '../../notifications/notification.service';

export async function signupUser(input: SignupUserBody): Promise<SignupUserResponse> {
    // 1) 중복 체크
    const [u1, u2, u3] = await Promise.all([
        userRepository.findUserIdByUsername(prismaClient, input.username),
        userRepository.findUserIdByEmail(prismaClient, input.email),
        userRepository.findUserIdByContact(prismaClient, input.contact),
    ]);

    if (u1 || u2 || u3) throw new ConflictError('이미 사용 중인 정보(아이디, 이메일, 전화번호)입니다.');

    // 2) 비밀번호 해싱
    const hashedPassword = await hashPassword(input.password);

    // 3) 트랜잭션: (아파트/유닛 확인 -> 명부 확인 -> 유저 생성 -> 명부 연결)
    const result = await prismaClient.$transaction(async (tx) => {
        // [수정된 부분 1] 아파트 이름으로 아파트 ID 조회
        const apartment = await tx.apartment.findFirst({
            where: { name: input.apartmentName },
        });

        if (!apartment) {
            throw new BadRequestError('해당 이름의 아파트를 찾을 수 없습니다.');
        }

        // [수정된 부분 2] 조회한 아파트 ID와 프론트에서 넘어온 동/호수로 유닛(unit) 조회
        const unitInfo = await tx.apartmentUnit.findUnique({
            where: {
                apartmentId_dong_ho: {
                    apartmentId: apartment.id,
                    dong: input.apartmentDong,
                    ho: input.apartmentHo,
                },
            },
        });

        if (!unitInfo) {
            throw new BadRequestError('존재하지 않는 아파트 동/호수입니다.');
        }

        // 2. 명부에 존재하는지 확인 (기존 로직 유지)
        const resident = await residentRepository.findResidentForAutoApprove(tx, {
            apartmentId: unitInfo.apartmentId,
            dong: unitInfo.dong,
            ho: unitInfo.ho,
            name: input.name,
            contact: input.contact,
        });

        // 입주민 명부에는 존재하고, 아직 가입한 적이 없는 깨끗한 데이터인가?
        const shouldAutoApprove = resident !== null && resident.userId == null;

        const joinStatus = shouldAutoApprove ? JoinStatus.APPROVED : JoinStatus.PENDING;

        const user = await authRepository.createUserForSignupUser(tx, {
            username: input.username,
            hashedPassword,
            contact: input.contact,
            name: input.name,
            email: input.email,
            unitId: unitInfo.id, // [수정된 부분 3] input.unitId 대신 DB에서 찾은 unitInfo.id 사용
            apartmentId: unitInfo.apartmentId,
            role: (input.role as Role) || Role.USER, // 프론트에서 받은 role 적용 (없으면 USER)
            joinStatus: joinStatus,
        });

        // 자동 승인 대상이 맞고, 명부 데이터가 실제로 존재할 때
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
            joinStatus: joinStatus,
            role: user.role,
            apartmentId: unitInfo.apartmentId,
        };
    });

    // 4) 가입 승인 대기 시 관리자에게 알림
    if (result.joinStatus === JoinStatus.PENDING) {
        const admins = await userRepository.findAdminsByApartmentId(prismaClient, result.apartmentId);
        if (admins.length > 0) {
            const notificationPromises = admins.map((admin) =>
                sendNotificationToUser({
                    userId: admin.id,
                    content: `새로운 입주민 가입 신청이 있습니다: ${result.name}`,
                    notificationType: 'SIGNUP_REQ',
                })
            );
            await Promise.all(notificationPromises);
        }
    }

    return {
        id: result.id,
        name: result.name,
        email: result.email,
        joinStatus: result.joinStatus,
        isActive: true,
        role: result.role,
    };
}