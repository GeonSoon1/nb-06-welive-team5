import * as s from 'superstruct';
import { ExpressRequest, ExpressResponse } from '../libs/constants';
import * as complaintService from './complaint.services';
import {
  CreateComplaintStruct,
  UpdateUserComplaintStruct,
  UpdateComplaintStatusStruct,
  GetComplaintsQueryStruct,
} from './complaint.struct';
import { GetComplaintsQuery } from './complaint.type';
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
  const authorId = req.user?.id;
  const apartmentId = req.user?.apartmentId;

  if (!authorId || !apartmentId) throw new UnauthorizedError('인증 정보가 유효하지 않습니다.');

  const data = s.create(req.body, CreateComplaintStruct);
  await complaintService.createComplaint(authorId, apartmentId, data);

  return res.status(201).json({ message: '정상적으로 등록 처리되었습니다' });
}

export async function getComplaints(req: ExpressRequest, res: ExpressResponse) {
  const { apartmentId, id: userId, role: userRole } = req.user || {};
  if (!apartmentId || !userId || !userRole)
    throw new UnauthorizedError('인증 정보가 유효하지 않습니다.');

  const query = s.create(req.query, GetComplaintsQueryStruct) as GetComplaintsQuery;
  const result = await complaintService.getComplaints(apartmentId, userId, userRole, query);

  return res.status(200).json(result);
}

export async function getComplaintDetail(req: ExpressRequest, res: ExpressResponse) {
  const { id: userId, role: userRole } = req.user || {};

  if (!userId || !userRole) throw new UnauthorizedError('인증 정보가 유효하지 않습니다.');

  const complaintId = getValidComplaintId(req);
  const result = await complaintService.getComplaintDetail(complaintId, userId, userRole);

  return res.status(200).json(result);
}

export async function updateUserComplaint(req: ExpressRequest, res: ExpressResponse) {
  const userId = req.user?.id;
  if (!userId) throw new UnauthorizedError('인증 정보가 유효하지 않습니다.');

  const complaintId = getValidComplaintId(req);
  const data = s.create(req.body, UpdateUserComplaintStruct);
  const result = await complaintService.updateUserComplaint(complaintId, userId, data);

  return res.status(200).json(result);
}

export async function deleteUserComplaint(req: ExpressRequest, res: ExpressResponse) {
  const userId = req.user?.id;

  if (!userId) throw new UnauthorizedError('인증 정보가 유효하지 않습니다.');

  const complaintId = getValidComplaintId(req);
  await complaintService.deleteUserComplaint(complaintId, userId);

  return res.status(200).json({ message: '정상적으로 삭제 처리되었습니다' });
}

export async function updateComplaintStatus(req: ExpressRequest, res: ExpressResponse) {
  const complaintId = getValidComplaintId(req);
  const data = s.create(req.body, UpdateComplaintStatusStruct);
  const result = await complaintService.updateComplaintStatus(complaintId, data);

  return res.status(200).json(result);
}
