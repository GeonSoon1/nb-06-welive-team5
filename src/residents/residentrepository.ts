import { prismaClient as prisma, Prisma } from '../libs/constants';
import { CreateResidentDto, UpdateResidentDto } from './residentstruct';
import { GetResidentsQuery } from './resident.type';

export class ResidentRepository {
  // 입주민 리소스 생성(개별 등록)
  async createResident(apartmentId: string, data: CreateResidentDto) {
    const newResident = await prisma.resident.create({
      data: {
        apartmentId: apartmentId,
        name: data.name,
        dong: data.building,
        ho: data.unitNumber,
        contact: data.contact,
        isHouseholder: data.isHouseholder,
        residenceStatus: 'RESIDENCE',
      },
      include: { user: true },
    });

    return newResident;
  }

  // 조회
  async findResidentsByApartment(apartmentId: string, query: GetResidentsQuery = {}) {
    const { page, limit, building, unitNumber, residenceStatus, keyword } = query;

    // 명세서 규칙: 기본값 1, 20 / 최대 100개
    const take = Math.min(Number(limit || 20), 100);
    const skip = (Math.max(Number(page || 1), 1) - 1) * take;

    const where: Prisma.ResidentWhereInput = {
      apartmentId,
      ...(building && { dong: building }),
      ...(unitNumber && { ho: unitNumber }),
      ...(residenceStatus && { residenceStatus }),
      ...(keyword && { name: { contains: keyword } }),
    };

    const [residents, totalCount] = await Promise.all([
      prisma.resident.findMany({
        where,
        skip,
        take,
        include: { user: true }, // userId, email을 위해 포함
      }),
      prisma.resident.count({ where }),
    ]);

    return { residents, totalCount };
  }

  // 입주민 상세조회
  async findResidentById(id: string) {
    return await prisma.resident.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  // 입주민 정보 수정
  async updateResident(id: string, data: UpdateResidentDto) {
    return await prisma.resident.update({
      where: { id },
      data: {
        name: data.name,
        dong: data.building,
        ho: data.unitNumber,
        contact: data.contact,
        isHouseholder: data.isHouseholder,
      },
      include: { user: true }, // 매퍼 사용을 위해 user 정보도 포함
    });
  }

  // 입주민 삭제
  async deleteResident(id: string) {
    return await prisma.resident.delete({
      where: { id: id },
    });
  }

  async createManyResidents(data: Prisma.ResidentCreateManyInput[]) {
    return await prisma.resident.createMany({
      data: data,
      skipDuplicates: true, // 이미 존재하는 데이터(중복)는 무시하고 저장
    });
  }
}
