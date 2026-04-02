import * as s from 'superstruct';
import { ExpressRequest, ExpressResponse } from '../libs/constants';
import * as residentService from './resident.services';
import {
  CreateResidentStruct,
  UpdateResidentStruct,
  GetResidentsQueryStruct,
  GetResidentsQueryDto,
  ResidentIdParamsStruct,
} from './resident.struct';
import { ResidentListItem } from './resident.type';
import BadRequestError from '../libs/errors/BadRequestError';
import UnauthorizedError from '../libs/errors/UnauthorizedError';
import { UpdateStatusBodyStruct } from '../users/user.struct';

const mapToResidentResponse = (r: ResidentListItem) => ({
  id: r.id,
  userId: r.user?.id || null,
  building: r.dong,
  unitNumber: r.ho,
  contact: r.contact,
  name: r.name,
  email: r.user?.email || null,
  residenceStatus: r.residenceStatus,
  isHouseholder: r.isHouseholder,
  isRegistered: !!r.userId,
  approvalStatus: r.user?.joinStatus || null,
});

const getValidResidentId = (req: ExpressRequest): string => {
  const { residentId } = req.params;
  if (!residentId || typeof residentId !== 'string') {
    throw new BadRequestError('입주민 ID가 올바르지 않습니다.');
  }
  return residentId;
};

// 1. 입주민 리소스 생성(개별 등록)
export async function createResident(req: ExpressRequest, res: ExpressResponse) {
  const apartmentId = req.user?.apartmentId;
  const { apartmentId: _apartmentId, residenceStatus, approvalStatus, ...body } = req.body;
  const data = s.create(body, CreateResidentStruct);

  if (!apartmentId) {
    throw new UnauthorizedError('아파트 정보가 유효하지 않습니다.');
  }

  const result = await residentService.createResident(apartmentId, data);
  return res.status(201).json({
    ...mapToResidentResponse(result),
    message: '입주민이 성공적으로 등록되었습니다.',
  });
}

// 2. 조회
export async function getResidents(req: ExpressRequest, res: ExpressResponse) {
  const apartmentId = req.user?.apartmentId;
  const query: GetResidentsQueryDto = s.create(req.query, GetResidentsQueryStruct);

  if (!apartmentId) {
    throw new UnauthorizedError('아파트 정보가 유효하지 않습니다.');
  }

  const { residents, totalCount } = await residentService.getResidents(apartmentId, query);
  return res.status(200).json({
    residents: residents.map(mapToResidentResponse),
    message: '입주민 목록을 성공적으로 불러왔습니다.',
    count: residents.length,
    totalCount,
  });
}

// 3. 사용자로부터 입주민 리소스 생성
export async function createResidentFromUser(req: ExpressRequest, res: ExpressResponse) {
  const apartmentId = req.user?.apartmentId;
  const { userId } = req.params;

  if (!apartmentId) throw new UnauthorizedError('아파트 정보가 유효하지 않습니다.');
  if (!userId || typeof userId !== 'string')
    throw new BadRequestError('유저 ID가 올바르지 않습니다.');

  const result = await residentService.createResidentFromUser(apartmentId, userId);
  return res.status(201).json({
    ...mapToResidentResponse(result),
    message: '유저 정보로 입주민 등록이 완료되었습니다.',
  });
}

// 4. 입주민 상세조회
export async function getResidentDetail(req: ExpressRequest, res: ExpressResponse) {
  const { apartmentId } = req.user!;
  const residentId = getValidResidentId(req);

  const result = await residentService.getResidentDetail(residentId, apartmentId!);

  return res.status(200).json(mapToResidentResponse(result));
}

// 5. 입주민 정보 수정
export async function updateResident(req: ExpressRequest, res: ExpressResponse) {
  const { apartmentId } = req.user!;
  const residentId = getValidResidentId(req);
  const data = s.create(req.body, UpdateResidentStruct);

  const result = await residentService.updateResident(residentId, apartmentId!, data);
  return res.status(200).json(mapToResidentResponse(result));
}

// 6. 입주민 삭제
export async function deleteResident(req: ExpressRequest, res: ExpressResponse) {
  const { apartmentId } = req.user!;
  const residentId = getValidResidentId(req);

  await residentService.deleteResident(residentId, apartmentId!);

  return res.status(200).json({ message: '작업이 성공적으로 완료되었습니다' });
}

// 7. CSV 업로드
export async function uploadCsv(req: ExpressRequest, res: ExpressResponse) {
  const apartmentId = req.user?.apartmentId;

  if (!req.file) throw new BadRequestError('파일로부터 입주민 리소스 생성 실패');

  if (!apartmentId) {
    throw new UnauthorizedError('아파트 정보가 유효하지 않습니다.');
  }

  const result = await residentService.uploadResidentsFromCsv(apartmentId, req.file.buffer);

  return res.status(201).json({
    message: `${result.count}명의 입주민이 등록되었습니다`,
    count: result.count,
  });
}

// 8. 템플릿 다운로드
export async function getTemplate(req: ExpressRequest, res: ExpressResponse) {
  const csvStream = await residentService.getCsvTemplate();
  res.setHeader('Content-disposition', 'attachment; filename="template.csv"');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.write('\uFEFF');
  csvStream.pipe(res);
}

// 9. 목록 다운로드
export async function exportCsv(req: ExpressRequest, res: ExpressResponse) {
  if (!req.user?.apartmentId)
    throw new UnauthorizedError('입주민 목록 파일 다운로드 실패(권한 없음)');

  const query: GetResidentsQueryDto = s.create(req.query, GetResidentsQueryStruct);
  const csvStream = await residentService.exportResidentsToCsv(req.user.apartmentId, query);

  res.setHeader('Content-disposition', 'attachment; filename="residents.csv"');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.write('\uFEFF');
  csvStream.pipe(res);
}

// 10. [admin] 입주민 (user) 상태 변경 (단건) (건순)
export async function updateResidentStatus(req: ExpressRequest, res: ExpressResponse) {
  // 1. URL 파라미터에서 대상 주민(USER) ID 추출
  const { residentId } = s.create(req.params, ResidentIdParamsStruct);

  // 2. 바디 데이터 검증
  const { status } = s.create(req.body, UpdateStatusBodyStruct);
  const apartmentId = req.user?.apartmentId;

  if (!apartmentId) {
    throw new UnauthorizedError('아파트 정보가 유효하지 않습니다.');
  }

  // 3. 서비스 호출
  await residentService.updateResidentStatus(residentId, apartmentId, status);

  return res.status(200).json({
    message: '작업이 성공적으로 완료되었습니다',
  });
}

// 11. [admin] 입주민 (user) 상태 일괄 변경 (건순)
export async function updateAllResidentStatus(req: ExpressRequest, res: ExpressResponse) {
  const { status } = s.create(req.body, UpdateStatusBodyStruct);

  if (!req.user) {
    throw new UnauthorizedError('인증 정보가 없습니다.');
  }
  const { apartmentId } = req.user;

  await residentService.updateAllResidentStatus(apartmentId!, status);

  return res.status(200).json({
    message: '작업이 성공적으로 완료되었습니다',
  });
}
