import * as complaintRepository from './complaint.repository';
import * as notificationRepository from '../notifications/notification.repository';
import {
  CreateComplaintDto,
  UpdateUserComplaintDto,
  UpdateComplaintStatusDto,
  GetComplaintsQueryDto,
} from './complaint.struct';
import {
  ComplaintWithAuthor,
  ComplaintListResponse,
  ComplaintDetailResponse,
} from './complaint.type';
import { NotificationType, prismaClient as prisma } from '../libs/constants';
import { Role } from '@prisma/client';
import BadRequestError from '../libs/errors/BadRequestError';
import NotFoundError from '../libs/errors/NotFoundError';
import ForbiddenError from '../libs/errors/ForbiddenError';

function formatComplaint(
  c: ComplaintWithAuthor,
  options: { isMasked?: boolean; includeDetails: true; },
): ComplaintDetailResponse;
function formatComplaint(
  c: ComplaintWithAuthor,
  options?: { isMasked?: boolean; includeDetails?: false; },
): ComplaintListResponse;
function formatComplaint(
  c: ComplaintWithAuthor,
  options: { isMasked?: boolean; includeDetails?: boolean; } = {},
): ComplaintListResponse | ComplaintDetailResponse {
  const { isMasked = false, includeDetails = false } = options;
  const writerName = c.author?.name || '알 수 없음';

  const base: ComplaintListResponse = {
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
        c.comments?.map((comment) => ({
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
}

// 작성자 권한 및 민원 상태 검증 (수정/삭제용)
const validateUserComplaintAccess = async (
  complaintId: string,
  userId: string,
  apartmentId: string,
): Promise<ComplaintWithAuthor> => {
  const complaint = await complaintRepository.getComplaintById(complaintId);
  if (!complaint) throw new NotFoundError('해당 민원을 찾을 수 없습니다.');

  const isOwner = await complaintRepository.validateComplaintOwnership(complaintId, apartmentId);
  if (!isOwner) throw new ForbiddenError('해당 리소스에 대한 접근 권한이 없습니다.');

  const validComplaint = complaint as ComplaintWithAuthor;

  if (validComplaint.authorId !== userId)
    throw new ForbiddenError('자신이 작성한 민원만 접근할 수 있습니다.');

  if (validComplaint.status !== 'PENDING')
    throw new BadRequestError('이미 처리가 시작되었거나 완료된 민원은 변경할 수 없습니다.');

  return validComplaint;
};

//1. 민원 등록 및 관리자 알림
export async function createComplaint(
  authorId: string,
  apartmentId: string,
  data: CreateComplaintDto,
): Promise<ComplaintListResponse> {
  const boardId = await complaintRepository.getBoardIdByApartment(apartmentId);
  if (!boardId) throw new BadRequestError('해당 아파트의 게시판 정보를 찾을 수 없습니다.');

  const newComplaint = await complaintRepository.createComplaint(authorId, boardId, data);

  const apartment = await prisma.apartment.findUnique({
    where: { id: apartmentId },
    select: { adminId: true },
  });

  if (apartment?.adminId) {
    await notificationRepository.createNotification({
      content: '새로운 민원이 등록되었습니다.',
      notificationType: NotificationType.COMPLAINT_REQ,
      userId: apartment.adminId,
      complaintId: newComplaint.id,
    });
  }

  return formatComplaint(newComplaint as ComplaintWithAuthor);
}

//2. 민원 목록 조회
export async function getComplaints(
  apartmentId: string,
  userId: string,
  userRole: string,
  query: GetComplaintsQueryDto,
): Promise<{ complaints: ComplaintListResponse[]; totalCount: number; }> {
  const { complaints, totalCount } = await complaintRepository.getComplaints(apartmentId, query);

  const formattedComplaints = (complaints as ComplaintWithAuthor[]).map((c) => {
    const isAuthor = c.authorId === userId;
    const isAdmin = userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN;
    const canView = c.isPublic || isAuthor || isAdmin;

    return formatComplaint(c, { isMasked: !canView });
  });

  return { complaints: formattedComplaints, totalCount };
}

// 3. 민원 상세 조회

export async function getComplaintDetail(
  complaintId: string,
  userId: string,
  userRole: string,
  apartmentId: string,
): Promise<ComplaintDetailResponse> {
  const isOwner = await complaintRepository.validateComplaintOwnership(complaintId, apartmentId);
  if (!isOwner) throw new ForbiddenError('해당 민원에 접근 권한이 없습니다.');

  const complaint = await complaintRepository.getComplaintDetail(complaintId);
  if (!complaint) throw new NotFoundError('해당 민원을 찾을 수 없습니다.');

  const validComplaint = complaint as ComplaintWithAuthor;
  const isAuthor = validComplaint.authorId === userId;
  const isAdmin = userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN;

  if (!validComplaint.isPublic && !isAuthor && !isAdmin) {
    throw new ForbiddenError('비공개 민원은 작성자와 관리자만 볼 수 있습니다.');
  }

  await complaintRepository.incrementComplaintViewCount(complaintId);

  return formatComplaint(validComplaint, { includeDetails: true });
}

// 4. 민원 수정

export async function updateUserComplaint(
  complaintId: string,
  userId: string,
  apartmentId: string,
  data: UpdateUserComplaintDto,
  userRole: Role
): Promise<ComplaintListResponse> {

  const isAdmin = userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN;
  if (!isAdmin)
    await validateUserComplaintAccess(complaintId, userId, apartmentId);
  const updatedComplaint = await complaintRepository.updateUserComplaint(complaintId, data);

  return formatComplaint(updatedComplaint as ComplaintWithAuthor);
}

//5. 민원 삭제

export async function deleteUserComplaint(
  complaintId: string,
  userId: string,
  apartmentId: string, userRole: Role
): Promise<void> {

  const isAdmin = userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN;
  if (!isAdmin)
    await validateUserComplaintAccess(complaintId, userId, apartmentId);
  await complaintRepository.deleteUserComplaint(complaintId);
}

// 6. 관리자 민원 상태 수정 및 작성자 알림

export async function updateComplaintStatus(
  complaintId: string,
  apartmentId: string,
  data: UpdateComplaintStatusDto,
): Promise<ComplaintDetailResponse> {
  const isOwner = await complaintRepository.validateComplaintOwnership(complaintId, apartmentId);
  if (!isOwner) throw new ForbiddenError('해당 아파트의 민원 상태를 변경할 권한이 없습니다.');

  const updatedComplaint = await complaintRepository.updateComplaintStatus(
    complaintId,
    data.status,
  );

  if (updatedComplaint.authorId) {
    const statusMap = {
      IN_PROGRESS: NotificationType.COMPLAINT_IN_PROGRESS,
      RESOLVED: NotificationType.COMPLAINT_RESOLVED,
      REJECTED: NotificationType.COMPLAINT_REJECTED,
    } as const;

    await notificationRepository.createNotification({
      content: `귀하가 접수한 민원의 상태가 [${data.status}]로 변경되었습니다.`,
      notificationType:
        statusMap[data.status as keyof typeof statusMap] || NotificationType.GENERAL,
      userId: updatedComplaint.authorId,
      complaintId: updatedComplaint.id,
    });
  }

  return formatComplaint(updatedComplaint as ComplaintWithAuthor, {
    includeDetails: true,
  });
}
