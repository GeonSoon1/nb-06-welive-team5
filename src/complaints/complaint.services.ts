import * as complaintRepository from './complaint.repository';
import {
  CreateComplaintDto,
  UpdateUserComplaintDto,
  UpdateComplaintStatusDto,
} from './complaint.struct';
import { GetComplaintsQuery } from './complaint.type';
import BadRequestError from '../libs/errors/BadRequestError';
import NotFoundError from '../libs/errors/NotFoundError';
import ForbiddenError from '../libs/errors/ForbiddenError';

// ---------------------------------------------------------
// 🛠️ [실무 꿀팁] 재사용을 위한 Helper 함수들
// ---------------------------------------------------------

const formatComplaint = (
  c: any,
  options: { isMasked?: boolean; includeDetails?: boolean } = {},
) => {
  const { isMasked = false, includeDetails = false } = options;
  const writerName = c.author?.name || '알 수 없음';

  const base = {
    complaintId: c.id,
    userId: c.authorId,
    title: isMasked ? '🔒 비공개 민원입니다.' : c.title,
    writerName: isMasked ? '익명' : writerName,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    isPublic: c.isPublic,
    viewsCount: c.viewCount,
    commentsCount: c.commentsCount,
    status: c.status,
    dong: isMasked ? '' : c.author?.apartmentUnit?.dong || '',
    ho: isMasked ? '' : c.author?.apartmentUnit?.ho || '',
  };

  if (includeDetails) {
    return {
      ...base,
      content: c.content,
      boardType: '민원',
      comments:
        c.comments?.map((comment: any) => ({
          id: comment.id,
          userId: comment.authorId,
          content: comment.content,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
          writerName: comment.author?.name || '알 수 없음',
        })) || [],
    };
  }
  return base;
};

const validateUserComplaintAccess = async (complaintId: string, userId: string) => {
  const complaint = await complaintRepository.getComplaintById(complaintId);
  if (!complaint) throw new NotFoundError('해당 민원을 찾을 수 없습니다.');
  if (complaint.authorId !== userId)
    throw new ForbiddenError('자신이 작성한 민원만 접근할 수 있습니다.');
  if (complaint.status !== 'PENDING')
    throw new BadRequestError('이미 처리가 시작되었거나 완료된 민원은 변경할 수 없습니다.');
  return complaint;
};

export async function createComplaint(
  authorId: string,
  apartmentId: string,
  data: CreateComplaintDto,
) {
  const newComplaint = await complaintRepository.createComplaint(authorId, data.boardId, data);
  if (!newComplaint) throw new BadRequestError('민원 등록에 실패했습니다.');
  return newComplaint;
}

export async function getComplaints(
  apartmentId: string,
  userId: string,
  userRole: string,
  query: GetComplaintsQuery,
) {
  const { complaints, totalCount } = await complaintRepository.getComplaints(apartmentId, query);

  const formattedComplaints = complaints.map((c) => {
    const isAuthor = c.authorId === userId;
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    const canView = c.isPublic || isAuthor || isAdmin;

    return formatComplaint(c, { isMasked: !canView });
  });

  return { complaints: formattedComplaints, totalCount };
}

export async function getComplaintDetail(complaintId: string, userId: string, userRole: string) {
  const complaint = await complaintRepository.getComplaintDetail(complaintId);
  if (!complaint) throw new NotFoundError('해당 민원을 찾을 수 없습니다.');

  const isAuthor = complaint.authorId === userId;
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
  if (!complaint.isPublic && !isAuthor && !isAdmin) {
    throw new ForbiddenError('비공개 민원은 작성자와 관리자만 볼 수 있습니다.');
  }

  await complaintRepository.incrementComplaintViewCount(complaintId);
  complaint.viewCount += 1;

  return formatComplaint(complaint, { includeDetails: true });
}

export async function updateUserComplaint(
  complaintId: string,
  userId: string,
  data: UpdateUserComplaintDto,
) {
  await validateUserComplaintAccess(complaintId, userId);
  const updatedComplaint = await complaintRepository.updateUserComplaint(complaintId, data);
  return formatComplaint(updatedComplaint);
}

export async function deleteUserComplaint(complaintId: string, userId: string) {
  await validateUserComplaintAccess(complaintId, userId);
  await complaintRepository.deleteUserComplaint(complaintId);
}

export async function updateComplaintStatus(
  complaintId: string,
  userRole: string,
  data: UpdateComplaintStatusDto,
) {
  if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
    throw new ForbiddenError('관리자만 민원 상태를 변경할 수 있습니다.');
  }
  const updatedComplaint = await complaintRepository.updateComplaintStatus(
    complaintId,
    data.status,
  );
  return formatComplaint(updatedComplaint, { includeDetails: true });
}
