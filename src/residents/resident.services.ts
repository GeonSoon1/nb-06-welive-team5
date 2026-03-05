import * as csv from 'fast-csv';
import { Readable } from 'stream';
import { prismaClient as prisma, Prisma } from '../libs/constants';
import BadRequestError from '../libs/errors/BadRequestError';
import * as residentRepository from './resident.repository';
import { GetResidentsQuery, CsvUploadResult } from './resident.type';
import { CreateResidentDto, UpdateResidentDto } from './resident.struct';

// 1. 입주민 리소스 생성(개별 등록)
export async function createResident(apartmentId: string, data: CreateResidentDto) {
  const newResident = await residentRepository.createResident(apartmentId, data);
  if (!newResident) throw new BadRequestError('입주민 리소스 생성(개별 등록) 실패');
  return newResident;
}

// 2. 조회
export async function getResidents(apartmentId: string, query: GetResidentsQuery) {
  const result = await residentRepository.findResidentsByApartment(apartmentId, query);
  if (!result) throw new BadRequestError('입주민 목록 조회 실패');
  return result;
}

// 3. 사용자로부터 입주민 리소스 생성
export async function createResidentFromUser(apartmentId: string, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new BadRequestError('사용자로부터 입주민 리소스 생성 실패');
  }

  const result = await createResident(apartmentId, {
    name: user.name,
    contact: user.contact,
    building: user.dong ?? '',
    unitNumber: user.ho ?? '',
    isHouseholder: 'MEMBER',
  });

  return result;
}

// 4. 입주민 상세조회
export async function getResidentDetail(id: string) {
  const resident = await residentRepository.findResidentById(id);
  if (!resident) {
    throw new BadRequestError('입주민 상세 조회 실패');
  }
  return resident;
}

// 5. 입주민 정보 수정
export async function updateResident(id: string, updateData: UpdateResidentDto) {
  await getResidentDetail(id);
  const result = await residentRepository.updateResident(id, updateData);
  if (!result) throw new BadRequestError('입주민 정보 수정 실패');
  return result;
}

// 6. 입주민 삭제
export async function deleteResident(id: string) {
  await getResidentDetail(id);
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
          contact: row.연락처 || row.contact,
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
export async function exportResidentsToCsv(apartmentId: string, query: GetResidentsQuery) {
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
