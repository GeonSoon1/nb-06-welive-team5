import { ResidentRepository } from './residentrepository';
import { CreateResidentDto } from './residentstruct';
import { prismaClient as prisma, Prisma } from '../libs/constants';
import * as csv from 'fast-csv';
import { Readable } from 'stream';
import { GetResidentsQuery, CsvUploadResult } from './resident.type';
import BadRequestError from '../libs/errors/BadRequestError';

export class ResidentService {
  private residentRepository: ResidentRepository;

  constructor() {
    this.residentRepository = new ResidentRepository();
  }

  // 입주민 리소스 생성(개별 등록)
  async createResident(apartmentId: string, data: CreateResidentDto) {
    const newResident = await this.residentRepository.createResident(apartmentId, data);

    if (!newResident) throw new BadRequestError('입주민 리소스 생성(개별 등록) 실패');

    return newResident;
  }

  //입주민 목록 조회
  async getResidents(apartmentId: string, query: GetResidentsQuery) {
    const result = await this.residentRepository.findResidentsByApartment(apartmentId, query);

    if (!result) throw new BadRequestError('입주민 목록 조회 실패');

    return result;
  }

  // 사용자로부터 입주민 리소스 생성
  async createResidentFromUser(apartmentId: string, userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestError('사용자로부터 입주민 리소스 생성 실패');
    }

    const result = await this.createResident(apartmentId, {
      name: user.name,
      contact: user.contact,
      building: user.dong ?? '',
      unitNumber: user.ho ?? '',
      isHouseholder: 'MEMBER', // 기본값 설정
    });

    if (!result) {
      throw new BadRequestError('사용자로부터 입주민 리소스 생성 실패');
    }

    return result;
  }

  // 입주민 상세조회
  async getResidentDetail(id: string) {
    const resident = await this.residentRepository.findResidentById(id);

    if (!resident) {
      throw new BadRequestError('입주민 상세 조회 실패');
    }

    return resident;
  }

  // 입주민 정보 수정
  async updateResident(id: string, updateData: Partial<CreateResidentDto>) {
    await this.getResidentDetail(id);
    const result = await this.residentRepository.updateResident(id, updateData);
    if (!result) throw new BadRequestError('입주민 정보 수정 실패');
    return result;
  }

  // 입주민 삭제
  async deleteResident(id: string) {
    await this.getResidentDetail(id);
    const result = await this.residentRepository.deleteResident(id);
    if (!result) throw new BadRequestError('입주민 정보 삭제 실패');
    return result;
  }

  // 파일로부터 입주민 리소스 생성
  async uploadResidentsFromCsv(apartmentId: string, fileBuffer: Buffer): Promise<CsvUploadResult> {
    const residents: Prisma.ResidentCreateManyInput[] = [];

    return new Promise((resolve, reject) => {
      const stream = Readable.from(fileBuffer); // 버퍼를 스트림으로 변환

      csv
        .parseStream(stream, { headers: true }) // 첫 줄을 헤더로 인식
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
            const result = await this.residentRepository.createManyResidents(residents);
            if (!result) throw new BadRequestError('파일로부터 입주민 리소스 생성 실패');
            resolve(result);
          } catch (err) {
            reject(err);
          }
        })
        .on('error', (error) => reject(error));
    });
  }

  // 입주민 업로드 템플릿 다운로드
  async getCsvTemplate() {
    const headers = ['이름', '연락처', '동', '호', '세대주여부'];
    const csvStream = csv.format({ headers: true });

    csvStream.write(headers.reduce((obj, h) => ({ ...obj, [h]: '' }), {}));
    csvStream.end();

    if (!csvStream) throw new BadRequestError('입주민 업로드 템플릿 다운로드 실패');

    return csvStream;
  }

  // 입주민 목록 파일 다운로드 (전체 목록 내보내기)
  async exportResidentsToCsv(apartmentId: string, query: GetResidentsQuery) {
    const { residents } = await this.residentRepository.findResidentsByApartment(apartmentId, {
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
}
