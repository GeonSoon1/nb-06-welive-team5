import * as s from 'superstruct';
import { ExpressRequest, ExpressResponse } from '../libs/constants';
import * as residentService from './resident.services';
import { CreateResidentStruct, UpdateResidentStruct } from './resident.struct';
import { GetResidentsQuery, ResidentWithUser } from './resident.type';
import BadRequestError from '../libs/errors/BadRequestError';
import UnauthorizedError from '../libs/errors/UnauthorizedError';

const mapToResidentResponse = (r: ResidentWithUser) => ({
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
});

// 1. 입주민 리소스 생성(개별 등록)
export async function createResident(req: ExpressRequest, res: ExpressResponse) {
  const apartmentId = req.user?.apartmentId;
  const data = s.create(req.body, CreateResidentStruct);

  if (!apartmentId) {
    throw new UnauthorizedError('아파트 정보가 유효하지 않습니다.');
  }

  const result = await residentService.createResident(apartmentId, data);
  return res.status(201).json({
    ...mapToResidentResponse(result as ResidentWithUser),
    message: '입주민이 성공적으로 등록되었습니다.',
  });
}

// 2. 조회
export async function getResidents(req: ExpressRequest, res: ExpressResponse) {
  const apartmentId = req.user?.apartmentId;
  const query = req.query as unknown as GetResidentsQuery;

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

  if (!apartmentId) {
    throw new UnauthorizedError('아파트 정보가 유효하지 않습니다.');
  }

  const result = await residentService.createResidentFromUser(apartmentId, userId as string);
  return res.status(201).json({
    ...mapToResidentResponse(result as ResidentWithUser),
    message: '유저 정보로 입주민 등록이 완료되었습니다.',
  });
}

// 4. 입주민 상세조회
export async function getResidentDetail(req: ExpressRequest, res: ExpressResponse) {
  const { residentId } = req.params;
  const resident = await residentService.getResidentDetail(residentId as string);
  return res.status(200).json(mapToResidentResponse(resident as ResidentWithUser));
}

// 5. 입주민 정보 수정
export async function updateResident(req: ExpressRequest, res: ExpressResponse) {
  const { residentId } = req.params;
  const data = s.create(req.body, UpdateResidentStruct);
  const result = await residentService.updateResident(residentId as string, data);
  return res.status(200).json(mapToResidentResponse(result as ResidentWithUser));
}

// 6. 입주민 삭제
export async function deleteResident(req: ExpressRequest, res: ExpressResponse) {
  const { residentId } = req.params;
  await residentService.deleteResident(residentId as string);
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
  csvStream.pipe(res);
}

// 9. 목록 다운로드
export async function exportCsv(req: ExpressRequest, res: ExpressResponse) {
  if (!req.user?.apartmentId)
    throw new UnauthorizedError('입주민 목록 파일 다운로드 실패(권한 없음)');
  const query = req.query as unknown as GetResidentsQuery;
  const csvStream = await residentService.exportResidentsToCsv(req.user.apartmentId, query);
  res.setHeader('Content-disposition', 'attachment; filename="residents.csv"');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  csvStream.pipe(res);
}
