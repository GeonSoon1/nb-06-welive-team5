import { ExpressRequest, ExpressResponse, Prisma } from '../libs/constants';
import { ResidentService } from './resident-services';
import { CreateResidentDto } from './resident-struct';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { GetResidentsQuery, ResidentWithUser, CsvUploadResult } from './resident.type';
import BadRequestError from '../libs/errors/BadRequestError';
import UnauthorizedError from '../libs/errors/UnauthorizedError';

export class ResidentController {
  private residentService: ResidentService;

  constructor() {
    this.residentService = new ResidentService();
  }

  // 명세셔 규격에 맞게 데이터 변환 (공통 매퍼)
  private mapToResidentResponse(r: ResidentWithUser) {
    return {
      id: r.id,
      userId: r.user ? { id: r.user.id } : {},
      building: r.dong,
      unitNumber: r.ho,
      contact: r.contact,
      name: r.name,
      email: r.user ? { email: r.user.email } : {},
      residenceStatus: r.residenceStatus,
      isHouseholder: r.isHouseholder,
      isRegistered: !!r.userId,
      approvalStatus: 'PENDING',
    };
  }

  // 입주민 리소스 생성(개별 등록)
  createResident = async (req: ExpressRequest, res: ExpressResponse) => {
    const apartmentId = req.user?.apartmentId || 'test-apt-id';
    const createResidentDto = plainToInstance(CreateResidentDto, req.body);
    const errors = await validate(createResidentDto);

    if (errors.length > 0) {
      throw new BadRequestError('입주민 리소스 생성(개별 등록) 실패');
    }

    const result = await this.residentService.createResident(apartmentId, createResidentDto);

    return res.status(201).json({
      ...this.mapToResidentResponse(result as ResidentWithUser),
      message: '입주민이 성공적으로 등록되었습니다.',
    });
  };

  //입주민 목록 조회
  getResidents = async (req: ExpressRequest, res: ExpressResponse) => {
    const apartmentId = req.user?.apartmentId || 'test-apt-123';
    const query = req.query as unknown as GetResidentsQuery;

    const { residents, totalCount } = await this.residentService.getResidents(apartmentId, query);

    return res.status(200).json({
      residents: residents.map((r: ResidentWithUser) => this.mapToResidentResponse(r)),
      message: '입주민 목록을 성공적으로 불러왔습니다.',
      count: residents.length,
      totalCount: totalCount,
    });
  };

  // 사용자로부터 입주민 리소스 생성
  createResidentFromUser = async (req: ExpressRequest, res: ExpressResponse) => {
    const apartmentId = req.user?.apartmentId || 'test-apt-123';
    const userId = req.params.userId as string;

    const result = await this.residentService.createResidentFromUser(apartmentId, userId);

    return res.status(201).json({
      ...this.mapToResidentResponse(result as ResidentWithUser),
      message: '유저 정보로 입주민 등록이 완료되었습니다.',
    });
  };

  // 입주민 상세조회
  getResidentDetail = async (req: ExpressRequest, res: ExpressResponse) => {
    const { residentId } = req.params;
    const resident = await this.residentService.getResidentDetail(residentId as string);

    return res.status(200).json(this.mapToResidentResponse(resident as ResidentWithUser));
  };

  // 입주민 정보 수정
  updateResident = async (req: ExpressRequest, res: ExpressResponse) => {
    const { residentId } = req.params;
    const result = await this.residentService.updateResident(residentId as string, req.body);

    return res.status(200).json(this.mapToResidentResponse(result as ResidentWithUser));
  };

  // 입주민 삭제
  deleteResident = async (req: ExpressRequest, res: ExpressResponse) => {
    const { residentId } = req.params;
    await this.residentService.deleteResident(residentId as string);

    return res.status(200).json({
      message: '작업이 성공적으로 완료되었습니다',
    });
  };

  // 파일로부터 입주민 리소스 생성
  uploadCsv = async (req: ExpressRequest, res: ExpressResponse) => {
    const apartmentId = req.user?.apartmentId || 'test-apt-123';

    if (!req.file) {
      throw new BadRequestError('파일로부터 입주민 리소스 생성 실패');
    }

    const result = (await this.residentService.uploadResidentsFromCsv(
      apartmentId,
      req.file.buffer,
    )) as CsvUploadResult;

    return res.status(201).json({
      message: `${result.count}명의 입주민이 등록되었습니다`,
      count: result.count,
    });
  };

  // 입주민 업로드 템플릿 다운로드
  getTemplate = async (req: ExpressRequest, res: ExpressResponse) => {
    const csvStream = await this.residentService.getCsvTemplate();

    res.setHeader(
      'Content-disposition',
      'attachment; filename="residents_template.csv"; filename*=UTF-8\'\'%EC%9E%85%EC%A3%BC%EB%AF%BC%EB%AA%85%EB%B6%80_%ED%85%9C%ED%94%8C%EB%A6%BF.csv',
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');

    csvStream.pipe(res);
  };

  // 입주민 목록 파일 다운로드
  exportCsv = async (req: ExpressRequest, res: ExpressResponse) => {
    if (!req.user || !req.user.apartmentId) {
      throw new UnauthorizedError('입주민 목록 파일 다운로드 실패(권한 없음)');
    }

    const query = req.query as unknown as GetResidentsQuery;
    const csvStream = await this.residentService.exportResidentsToCsv(req.user.apartmentId, query);

    const now = new Date();
    const timestamp = now.toISOString().replace(/[:T-]/g, '').slice(0, 14);
    const fileName = `입주민명부_${timestamp}.csv`;

    const encodedFileName = encodeURIComponent(fileName);
    res.setHeader(
      'Content-disposition',
      `attachment; filename="residents.csv"; filename*=UTF-8''${encodedFileName}`,
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');

    csvStream.pipe(res);
  };
}
