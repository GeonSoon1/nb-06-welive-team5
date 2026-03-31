import * as s from 'superstruct';
import { ExpressRequest, ExpressResponse } from '../libs/constants';
import * as complaintService from './complaint.services';
import {
  CreateComplaintStruct,
  UpdateUserComplaintStruct,
  UpdateComplaintStatusStruct,
  GetComplaintsQueryStruct,
  GetComplaintsQueryDto,
} from './complaint.struct';
import UnauthorizedError from '../libs/errors/UnauthorizedError';
import BadRequestError from '../libs/errors/BadRequestError';

const getValidComplaintId = (req: ExpressRequest): string => {
  const { complaintId } = req.params;
  if (!complaintId || typeof complaintId !== 'string') {
    throw new BadRequestError('민원 ID가 올바르지 않습니다.');
  }
  return complaintId;
};

export async function createComplaint(req: ExpressRequest, res: ExpressResponse) {
  const { id: authorId, apartmentId } = req.user!;
  const { boardId, userId, ...bodyWithoutExtras } = req.body;

  const data = s.create(bodyWithoutExtras, CreateComplaintStruct);

  await complaintService.createComplaint(authorId, apartmentId!, data);

  return res.status(201).json({ message: '정상적으로 등록 처리되었습니다' });
}

export async function getComplaints(req: ExpressRequest, res: ExpressResponse) {
  const { apartmentId, id: userId, role: userRole } = req.user || {};
  if (!apartmentId || !userId || !userRole)
    throw new UnauthorizedError('인증 정보가 유효하지 않습니다.');

  const query: GetComplaintsQueryDto = s.create(req.query, GetComplaintsQueryStruct);
  const result = await complaintService.getComplaints(apartmentId, userId, userRole, query);

  return res.status(200).json(result);
}

export async function getComplaintDetail(req: ExpressRequest, res: ExpressResponse) {
  const { id: userId, role: userRole, apartmentId } = req.user || {};

  if (!userId || !userRole || !apartmentId)
    throw new UnauthorizedError('인증 정보가 유효하지 않습니다.');

  const complaintId = getValidComplaintId(req);
  const result = await complaintService.getComplaintDetail(
    complaintId,
    userId,
    userRole,
    apartmentId,
  );

  return res.status(200).json(result);
}

export async function updateUserComplaint(req: ExpressRequest, res: ExpressResponse) {
  const { id: userId, apartmentId } = req.user!;
  const complaintId = getValidComplaintId(req);
  const { boardId, userId: extraUserId, ...bodyWithoutExtras } = req.body;

  const data = s.create(bodyWithoutExtras, UpdateUserComplaintStruct);

  const userRole = req.user!.role;
  const result = await complaintService.updateUserComplaint(
    complaintId,
    userId,
    apartmentId!,
    data,
    userRole
  );

  return res.status(200).json(result);
}

export async function deleteUserComplaint(req: ExpressRequest, res: ExpressResponse) {
  const { id: userId, apartmentId } = req.user!;

  if (!userId) throw new UnauthorizedError('인증 정보가 유효하지 않습니다.');

  const complaintId = getValidComplaintId(req);

  const userRole = req.user!.role;
  await complaintService.deleteUserComplaint(complaintId, userId, apartmentId!, userRole);

  return res.status(200).json({ message: '정상적으로 삭제 처리되었습니다' });
}

export async function updateComplaintStatus(req: ExpressRequest, res: ExpressResponse) {
  const { apartmentId } = req.user!;
  const complaintId = getValidComplaintId(req);

  const { boardId, userId, ...bodyWithoutExtras } = req.body;
  const data = s.create(bodyWithoutExtras, UpdateComplaintStatusStruct);

  const result = await complaintService.updateComplaintStatus(complaintId, apartmentId!, data);

  return res.status(200).json(result);
}
