import { prismaClient } from '../../libs/constants';
import { hashPassword } from '../../libs/auth/password';
import ConflictError from '../../libs/errors/ConflictError';
import { User, ApartmentStatus, Prisma, Role } from '@prisma/client';
import { SignupAdminBody } from '../auth.struct';
import * as apartmentRepository from '../../apartments/apartment.repository';
import * as userRepository from '../../users/user.repository';
import * as authRepository from '../auth.repository';
import { SignupAdminResponse } from '../auth.type';
import { sendNotificationToUser } from '../../notifications/notification.service';

export async function signupAdmin(input: SignupAdminBody): Promise<User> {
    // 1. 유저 정보 중복 체크 (ID, Email, Contact)
    const [u1, u2, u3] = await Promise.all([
        userRepository.findUserIdByUsername(prismaClient, input.username),
        userRepository.findUserIdByEmail(prismaClient, input.email),
        userRepository.findUserIdByContact(prismaClient, input.contact),
    ]);

    if (u1 || u2 || u3) throw new ConflictError('이미 사용 중인 정보(아이디, 이메일, 전화번호)입니다.');

    // 2. 아파트 중복 신청 체크
    const existingApartment = await apartmentRepository.findExistingApartment(
        prismaClient,
        input.apartmentName,
        input.apartmentAddress,
        input.apartmentManagementNumber
    );

    if (existingApartment) throw new ConflictError('이미 등록되었거나 신청 진행 중인 아파트 정보입니다.');

    // 3. 비밀번호 해싱
    const hashedPassword = await hashPassword(input.password);

    // 4. 트랜잭션 시작: 아파트와 유저를 원자적(Atomic)으로 생성.
    const newUser = await prismaClient.$transaction(async (tx) => {
        // A. 아파트 단지 생성
        const apartment = await apartmentRepository.createApartment(tx, {
            name: input.apartmentName,
            address: input.apartmentAddress,
            officeNumber: input.apartmentManagementNumber,
            description: input.description,
            apartmentStatus: ApartmentStatus.PENDING, // 슈퍼 관리자 승인 대기
        });

        // B. 동별 구조 설정 저장 및 실제 유닛 데이터 준비
        const unitData: Prisma.ApartmentUnitCreateManyInput[] = [];

        for (const group of input.structureGroups) {
            // 1) 구조 설정 저장
            await apartmentRepository.createStructureGroup(tx, {
                dongList: group.dongList,
                startFloor: group.startFloor,
                maxFloor: group.maxFloor,
                unitsPerFloor: group.unitsPerFloor,
                apartment: { connect: { id: apartment.id } },
                // 단순히 숫자나 문자열 ID를 넣는 게 아니라, '아파트라는 객체' 자체와 연결
            });

            // 2) dongList 파싱 (예: "101, 102" -> ["101", "102"])
            const dongs = group.dongList.split(',').map((d) => d.trim());

            // 3) 반복문을 돌며 유닛 조합 생성
            for (const dong of dongs) {
                for (let floor = group.startFloor; floor <= group.maxFloor; floor++) {
                    for (let ho = 1; ho <= group.unitsPerFloor; ho++) {
                        const calculatedHo = floor * 100 + ho;
                        unitData.push({
                            apartmentId: apartment.id,
                            dong: dong,
                            floor: floor, //Template Literal(`${}`)을 쓰면 아주 깔끔하게 문자열이 된다.
                            ho: `${calculatedHo}`, // 예: 1층 1호 -> 101호
                        });
                    }
                }
            }
        }

        // C. 생성된 모든 유닛을 한 번에 DB에 넣기
        await apartmentRepository.createManyUnits(tx, unitData);

        // D. 관리자 유저 생성
        const user = await authRepository.createAdminUser(tx, {
            username: input.username,
            hashedPassword,
            name: input.name,
            email: input.email,
            contact: input.contact,
            apartmentId: apartment.id,
        });
        return user;
    });

    // 5. 알림 전송: 슈퍼 관리자에게 새로운 관리자 가입 신청 알림
    const superAdmins = await userRepository.findUsersByRole(prismaClient, Role.SUPER_ADMIN);

    if (superAdmins.length > 0) {
        const notificationPromises = superAdmins.map((superAdmin) =>
            sendNotificationToUser({
                userId: superAdmin.id,
                content: `새로운 관리자 가입 신청이 있습니다: ${input.name} (${input.apartmentName})`,
                notificationType: 'SIGNUP_REQ',
            })
        );
        await Promise.all(notificationPromises);
    }

    return newUser;
}


export function formatAdminResponse(user: User): SignupAdminResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    joinStatus: user.joinStatus,
    isActive: true, // "로그인에 성공했다"는 것 자체가 이미 이 유저가 활성화된 계정임을 증명
  };
}
