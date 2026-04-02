import * as csv from 'fast-csv';
import { Readable } from 'stream';
import { prismaClient as prisma, Prisma } from '../libs/constants';
import BadRequestError from '../libs/errors/BadRequestError';
import ForbiddenError from '../libs/errors/ForbiddenError';
import * as residentRepository from './resident.repository';
import * as userRepository from '../users/user.repository';
import { CsvUploadResult } from './resident.type';
import { CreateResidentDto, UpdateResidentDto, GetResidentsQueryDto } from './resident.struct';
import { JoinStatus, Role } from '@prisma/client';

type ResidentApprovalDb = Prisma.TransactionClient | typeof prisma;

const hasKnownCsvHeader = (text: string): boolean => {
  const firstLine = text.split(/\r?\n/, 1)[0]?.replace(/^\uFEFF/, '') ?? '';
  if (!firstLine) return false;

  const knownHeaders = ['이름', '연락처', '동', '호', '세대주여부', 'name', 'contact', 'building', 'unitNumber'];
  return knownHeaders.some((header) => firstLine.includes(header));
};

const decodeCsvBuffer = (fileBuffer: Buffer): string => {
  const utf8Text = fileBuffer.toString('utf8');
  if (hasKnownCsvHeader(utf8Text)) return utf8Text;

  const eucKrText = new TextDecoder('euc-kr').decode(fileBuffer);
  if (hasKnownCsvHeader(eucKrText)) return eucKrText;

  return utf8Text;
};

const normalizeCsvRow = (row: Record<string, unknown>): Record<string, string> => {
  const normalized: Record<string, string> = {};

  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = key.replace(/^\uFEFF/, '').trim();
    normalized[normalizedKey] = typeof value === 'string' ? value.trim() : String(value ?? '').trim();
  }

  return normalized;
};

const normalizeDong = (value: string): string => value.replace(/동$/, '').replace(/\D/g, '');
const normalizeHo = (value: string): string => value.replace(/호$/, '').replace(/\D/g, '');
const normalizeContact = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 10 && digits.startsWith('10')) {
    return `0${digits}`;
  }
  return digits;
};

const toHouseholderStatus = (value: string): 'HOUSEHOLDER' | 'MEMBER' => {
  const normalized = value.trim().toLowerCase();
  return value.trim() === '세대주' ||
    normalized === 'householder' ||
    normalized === 'y' ||
    normalized === 'yes' ||
    normalized === 'true' ||
    normalized === '1'
    ? 'HOUSEHOLDER'
    : 'MEMBER';
};

async function validateResidentOwnership(residentId: string, apartmentId: string) {
  const resident = await residentRepository.findResidentById(residentId);

  if (!resident) {
    throw new BadRequestError('해당 입주민을 찾을 수 없습니다.');
  }

  if (resident.apartmentId !== apartmentId) {
    throw new ForbiddenError('해당 아파트의 입주민 정보에 접근할 권한이 없습니다.');
  }

  return resident;
}

async function ensureResidentResourceForApprovedUser(
  db: ResidentApprovalDb,
  user: {
    id: string;
    name: string;
    contact: string;
    apartmentUnit: {
      dong: string;
      ho: string;
    } | null;
  },
  apartmentId: string,
) {
  if (!user.apartmentUnit) {
    throw new BadRequestError('동/호수 정보가 없는 계정은 승인할 수 없습니다.');
  }

  const matchedResident = await residentRepository.findResidentForAutoApprove(db, {
    apartmentId,
    dong: user.apartmentUnit.dong,
    ho: user.apartmentUnit.ho,
    name: user.name,
    contact: user.contact,
  });

  if (matchedResident) {
    if (matchedResident.userId && matchedResident.userId !== user.id) {
      throw new BadRequestError('같은 입주민 명부가 이미 다른 계정과 연결되어 있습니다.');
    }

    if (!matchedResident.userId) {
      await residentRepository.linkResidentToUser(db, {
        residentId: matchedResident.id,
        userId: user.id,
      });
    }

    return;
  }

  await db.resident.create({
    data: {
      apartmentId,
      userId: user.id,
      dong: user.apartmentUnit.dong,
      ho: user.apartmentUnit.ho,
      name: user.name,
      contact: user.contact,
      isHouseholder: 'MEMBER',
      residenceStatus: 'RESIDENCE',
    },
  });
}

// 1. 입주민 리소스 생성(개별 등록)
export async function createResident(apartmentId: string, data: CreateResidentDto) {
  if (data.contact) {
    data.contact = normalizeContact(data.contact);
  }
  if (data.building) {
    data.building = data.building.replace(/동$/, '').replace(/\D/g, '');
  }
  if (data.unitNumber) {
    data.unitNumber = data.unitNumber.replace(/호$/, '').replace(/\D/g, '');
  }

  const newResident = await residentRepository.createResident(apartmentId, data);
  if (!newResident) throw new BadRequestError('입주민 리소스 생성(개별 등록) 실패');
  return newResident;
}

// 2. 조회
export async function getResidents(apartmentId: string, query: GetResidentsQueryDto) {
  const result = await residentRepository.findResidentsByApartment(apartmentId, query);
  if (!result) throw new BadRequestError('입주민 목록 조회 실패');

  // 관리자 승인 화면(isRegistered=true)에서는 resident 미연결 가입유저도 함께 노출한다.
  if (query.isRegistered === 'true') {
    const signupUsers = await residentRepository.findSignupUsersWithoutResidentByApartment(
      apartmentId,
      query,
    );

    return {
      residents: [...result.residents, ...signupUsers],
      totalCount: result.totalCount + signupUsers.length,
    };
  }

  return result;
}

// 3. 사용자로부터 입주민 리소스 생성
export async function createResidentFromUser(apartmentId: string, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { apartmentUnit: true },
  });

  if (!user) {
    throw new BadRequestError('사용자로부터 입주민 리소스 생성 실패');
  }

  const result = await createResident(apartmentId, {
    name: user.name,
    contact: normalizeContact(user.contact),
    building: user.apartmentUnit?.dong ?? '',
    unitNumber: user.apartmentUnit?.ho ?? '',
    isHouseholder: 'MEMBER',
  });

  return result;
}

// 4. 입주민 상세조회
export async function getResidentDetail(id: string, apartmentId: string) {
  const resident = await validateResidentOwnership(id, apartmentId);
  return resident;
}

// 5. 입주민 정보 수정
export async function updateResident(
  id: string,
  apartmentId: string,
  updateData: UpdateResidentDto,
) {
  await validateResidentOwnership(id, apartmentId);

  if (updateData.contact) {
    updateData.contact = normalizeContact(updateData.contact);
  }

  const result = await residentRepository.updateResident(id, updateData);
  if (!result) throw new BadRequestError('입주민 정보 수정 실패');

  return result;
}

// 6. 입주민 삭제
export async function deleteResident(id: string, apartmentId: string) {
  await validateResidentOwnership(id, apartmentId);

  const result = await residentRepository.deleteResident(id);
  if (!result) throw new BadRequestError('입주민 정보 삭제 실패');

  return result;
}

// 7. 파일로부터 입주민 리소스 생성 (CSV 업로드)
export async function uploadResidentsFromCsv(
  apartmentId: string,
  fileBuffer: Buffer,
): Promise<CsvUploadResult> {
  const residents: Prisma.ResidentCreateManyInput[] = [];
  const csvText = decodeCsvBuffer(fileBuffer).replace(/^\uFEFF/, '');

  return new Promise((resolve, reject) => {
    const stream = Readable.from([csvText]);

    csv
      .parseStream(stream, { headers: true })
      .on('data', (row: Record<string, unknown>) => {
        const normalizedRow = normalizeCsvRow(row);
        const { residenceStatus, approvalStatus, ...restOfRow } = normalizedRow as Record<string, string>;

        const name = restOfRow.이름 || restOfRow.name || '';
        const contact = normalizeContact(restOfRow.연락처 || restOfRow.contact || '');
        const dong = normalizeDong(restOfRow.동 || restOfRow.building || '');
        const ho = normalizeHo(restOfRow.호 || restOfRow.unitNumber || '');
        const householderValue = restOfRow.세대주여부 || restOfRow.isHouseholder || '';

        if (!name || !contact || !dong || !ho) {
          return;
        }

        residents.push({
          apartmentId: apartmentId,
          name,
          contact,
          dong,
          ho,
          isHouseholder: toHouseholderStatus(householderValue),
        });
      })
      .on('end', async () => {
        try {
          if (residents.length === 0) {
            throw new BadRequestError('CSV 파일에서 유효한 입주민 데이터를 찾을 수 없습니다.');
          }

          const result = await residentRepository.createManyResidents(residents);
          if (!result) throw new BadRequestError('파일로부터 입주민 리소스 생성 실패');
          resolve(result);
        } catch (err) {
          reject(err);
        }
      })
      .on('error', (error) => reject(error));
  });
}

// 8. 입주민 업로드 템플릿 다운로드
export async function getCsvTemplate() {
  const headers = ['이름', '연락처', '동', '호', '세대주여부'];
  const csvStream = csv.format({ headers: true });

  csvStream.write(headers.reduce((obj, h) => ({ ...obj, [h]: '' }), {}));
  csvStream.end();

  return csvStream;
}

// 9. 입주민 목록 파일 다운로드
export async function exportResidentsToCsv(apartmentId: string, query: GetResidentsQueryDto) {
  const { residents } = await residentRepository.findResidentsByApartment(apartmentId, {
    ...query,
    limit: '10000',
  });

  if (!residents) throw new BadRequestError('입주민 목록 파일 다운로드 실패');

  const csvStream = csv.format({ headers: true });

  residents.forEach((r) => {
    csvStream.write({
      이름: r.name,
      연락처: r.contact,
      동: r.dong,
      호: r.ho,
      세대주여부: r.isHouseholder === 'HOUSEHOLDER' ? '세대주' : '세대원',
    });
  });

  csvStream.end();
  return csvStream;
}

// 10. 입주민 (user) 상태 변경 (건순)
export async function updateResidentStatus(targetId: string, apartmentId: string, status: JoinStatus) {
  return await prisma.$transaction(async (tx) => {
    // 1. ResidentId를 통해 연결된 UserId와 현재 정보를 가져옴
    const resident = await residentRepository.findResidentWithAuthInfo(tx, targetId);
    let targetUserId: string;

    // 1-a. resident로 조회된 경우: 기존 플로우
    if (resident) {
      if (resident.apartmentId !== apartmentId) {
        throw new ForbiddenError('해당 아파트의 주민 정보에 접근할 권한이 없습니다.');
      }

      if (!resident.userId) {
        throw new BadRequestError('해당 주민과 연결된 유저 계정이 존재하지 않습니다.');
      }
      targetUserId = resident.userId;

      // 2. 보안 검증: 대상이 일반 주민(USER)인지 확인
      if (resident.user?.role !== Role.USER) {
        throw new BadRequestError('일반 주민 권한을 가진 계정만 상태 변경이 가능합니다.');
      }

      // 3. 비즈니스 로직: 멱등성 체크 (이미 같은 상태면 업데이트 생략)
      if (resident.user?.joinStatus !== status) {
        await userRepository.updateUserStatus(tx, resident.userId, status);
      }
    } else {
      // 1-b. resident 미연결 가입유저(user.id=targetId) fallback
      const user = await tx.user.findFirst({
        where: {
          id: targetId,
          apartmentId,
          role: Role.USER,
        },
        select: {
          id: true,
          name: true,
          contact: true,
          joinStatus: true,
          apartmentUnit: {
            select: {
              dong: true,
              ho: true,
            },
          },
        },
      });

      if (!user) {
        throw new BadRequestError('해당 주민 정보를 찾을 수 없습니다.');
      }

      targetUserId = user.id;

      if (user.joinStatus !== status) {
        await userRepository.updateUserStatus(tx, user.id, status);
      }
    }

    // 승인 상태라면 resident 존재를 강제 보장한다.
    if (status === JoinStatus.APPROVED) {
      const approvedUser = await tx.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true,
          name: true,
          contact: true,
          apartmentId: true,
          apartmentUnit: {
            select: {
              dong: true,
              ho: true,
            },
          },
          resident: {
            select: { id: true },
          },
        },
      });

      if (!approvedUser || approvedUser.apartmentId !== apartmentId) {
        throw new ForbiddenError('해당 아파트의 주민 정보에 접근할 권한이 없습니다.');
      }

      if (!approvedUser.resident) {
        await ensureResidentResourceForApprovedUser(
          tx,
          {
            id: approvedUser.id,
            name: approvedUser.name,
            contact: approvedUser.contact,
            apartmentUnit: approvedUser.apartmentUnit,
          },
          apartmentId,
        );
      }
    }
  });
}

// 11. 입주민 (user) 상태 일괄 변경 (건순)
export async function updateAllResidentStatus(apartmentId: string, status: JoinStatus) {
  const result = await prisma.$transaction(async (tx) => {
    if (status === JoinStatus.APPROVED) {
      const pendingUsersWithoutResident = await tx.user.findMany({
        where: {
          apartmentId,
          role: Role.USER,
          joinStatus: JoinStatus.PENDING,
          resident: null,
        },
        select: {
          id: true,
          name: true,
          contact: true,
          apartmentUnit: {
            select: {
              dong: true,
              ho: true,
            },
          },
        },
      });

      for (const pendingUser of pendingUsersWithoutResident) {
        await ensureResidentResourceForApprovedUser(tx, pendingUser, apartmentId);
      }
    }

    const updateResult = await userRepository.updateAllUsers(tx, {
      apartmentId,
      targetRole: Role.USER,
      fromStatus: JoinStatus.PENDING,
      toStatus: status,
    });

    if (status === JoinStatus.APPROVED) {
      const approvedUsersWithoutResident = await tx.user.findMany({
        where: {
          apartmentId,
          role: Role.USER,
          joinStatus: JoinStatus.APPROVED,
          resident: null,
        },
        select: {
          id: true,
          name: true,
          contact: true,
          apartmentUnit: {
            select: {
              dong: true,
              ho: true,
            },
          },
        },
      });

      for (const user of approvedUsersWithoutResident) {
        if (!user.apartmentUnit) continue;
        await ensureResidentResourceForApprovedUser(tx, user, apartmentId);
      }
    }

    return updateResult;
  });

  return result;
}
