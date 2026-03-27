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

// 1. 입주민 리소스 생성(개별 등록)
export async function createResident(apartmentId: string, data: CreateResidentDto) {
  if (data.contact) {
    data.contact = data.contact.replace(/\D/g, '');
  }

  const newResident = await residentRepository.createResident(apartmentId, data);
  if (!newResident) throw new BadRequestError('입주민 리소스 생성(개별 등록) 실패');
  return newResident;
}

// 2. 조회
export async function getResidents(apartmentId: string, query: GetResidentsQueryDto) {
  const result = await residentRepository.findResidentsByApartment(apartmentId, query);
  if (!result) throw new BadRequestError('입주민 목록 조회 실패');
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
    contact: user.contact.replace(/\D/g, ''),
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
    updateData.contact = updateData.contact.replace(/\D/g, '');
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

  return new Promise((resolve, reject) => {
    const stream = Readable.from(fileBuffer);

    csv
      .parseStream(stream, { headers: true })
      .on('data', (row) => {
        residents.push({
          apartmentId: apartmentId,
          name: row.이름 || row.name,
          contact: (row.연락처 || row.contact || '').toString().replace(/\D/g, ''),
          dong: row.동 || row.building || '',
          ho: row.호 || row.unitNumber || '',
          isHouseholder: row.세대주여부 === '세대주' ? 'HOUSEHOLDER' : 'MEMBER',
        });
      })
      .on('end', async () => {
        try {
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
export async function updateResidentStatus(residentId: string, status: JoinStatus) {
  // 1. ResidentId를 통해 연결된 UserId와 현재 정보를 가져옴
  const resident = await residentRepository.findResidentWithAuthInfo(prisma, residentId);

  if (!resident) {
    throw new BadRequestError('해당 주민 정보를 찾을 수 없습니다.');
  }

  if (!resident.userId) {
    throw new BadRequestError('해당 주민과 연결된 유저 계정이 존재하지 않습니다.');
  }

  // 2. 보안 검증: 대상이 일반 주민(USER)인지 확인
  if (resident.user?.role !== Role.USER) {
    throw new BadRequestError('일반 주민 권한을 가진 계정만 상태 변경이 가능합니다.');
  }

  // 3. 비즈니스 로직: 멱등성 체크 (이미 같은 상태면 업데이트 생략)
  if (resident.user?.joinStatus === status) {
    return;
  }

  return await userRepository.updateUserStatus(prisma, resident.userId, status);
}

// 11. 입주민 (user) 상태 일괄 변경 (건순)
export async function updateAllResidentStatus(apartmentId: string, status: JoinStatus) {
  const result = await userRepository.updateAllUsers(prisma, {
    apartmentId,
    targetRole: Role.USER,
    fromStatus: JoinStatus.PENDING,
    toStatus: status,
  });

  return result;
}
