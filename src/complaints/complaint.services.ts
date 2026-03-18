import * as complaintRepository from './complaint.repository';
import {
  CreateComplaintDto,
  UpdateUserComplaintDto,
  UpdateComplaintStatusDto,
  GetComplaintsQueryDto,
  ComplaintListResponse,
  ComplaintDetailResponse,
} from './complaint.struct';
import BadRequestError from '../libs/errors/BadRequestError';
import NotFoundError from '../libs/errors/NotFoundError';
import ForbiddenError from '../libs/errors/ForbiddenError';
import { ComplaintStatus } from '@prisma/client';

interface ComplaintWithAuthor {
  id: string;
  authorId: string | null;
  title: string;
  content: string;
  isPublic: boolean;
  viewCount: number;
  commentsCount: number;
  status: ComplaintStatus;
  createdAt: Date;
  updatedAt: Date;
  author?: {
    name: string;
    apartmentUnit?: {
      dong: string;
      ho: string;
    } | null;
  } | null;
  comments?: {
    id: string;
    authorId: string | null;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    author?: { name: string } | null;
  }[];
}

function formatComplaint(
  c: ComplaintWithAuthor,
  options: { isMasked?: boolean; includeDetails: true },
): ComplaintDetailResponse;
function formatComplaint(
  c: ComplaintWithAuthor,
  options?: { isMasked?: boolean; includeDetails?: false },
): ComplaintListResponse;
function formatComplaint(
  c: ComplaintWithAuthor,
  options: { isMasked?: boolean; includeDetails?: boolean } = {},
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

const validateUserComplaintAccess = async (
  complaintId: string,
  userId: string,
): Promise<ComplaintWithAuthor> => {
  const complaint = await complaintRepository.getComplaintById(complaintId);
  if (!complaint) throw new NotFoundError('해당 민원을 찾을 수 없습니다.');
  if (complaint.authorId !== userId)
    throw new ForbiddenError('자신이 작성한 민원만 접근할 수 있습니다.');
  if (complaint.status !== 'PENDING')
    throw new BadRequestError('이미 처리가 시작되었거나 완료된 민원은 변경할 수 없습니다.');

  return complaint as unknown as ComplaintWithAuthor;
};

export async function createComplaint(
  authorId: string,
  apartmentId: string,
  data: CreateComplaintDto,
): Promise<ComplaintListResponse> {
  const boardId = await complaintRepository.getBoardIdByApartment(apartmentId);
  if (!boardId) throw new BadRequestError('해당 아파트의 게시판 정보를 찾을 수 없습니다.');

  const newComplaint = await complaintRepository.createComplaint(authorId, boardId, data);
  if (!newComplaint) throw new BadRequestError('민원 등록에 실패했습니다.');

  return formatComplaint(newComplaint as unknown as ComplaintWithAuthor);
}

export async function getComplaints(
  apartmentId: string,
  userId: string,
  userRole: string,
  query: GetComplaintsQueryDto,
): Promise<{ complaints: ComplaintListResponse[]; totalCount: number }> {
  const { complaints, totalCount } = await complaintRepository.getComplaints(apartmentId, query);

  const formattedComplaints = complaints.map((c) => {
    const isAuthor = c.authorId === userId;
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    const canView = c.isPublic || isAuthor || isAdmin;

    return formatComplaint(c as unknown as ComplaintWithAuthor, {
      isMasked: !canView,
    });
  });

  return { complaints: formattedComplaints, totalCount };
}

export async function getComplaintDetail(
  complaintId: string,
  userId: string,
  userRole: string,
): Promise<ComplaintDetailResponse> {
  const complaint = await complaintRepository.getComplaintDetail(complaintId);
  if (!complaint) throw new NotFoundError('해당 민원을 찾을 수 없습니다.');

  const isAuthor = complaint.authorId === userId;
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
  if (!complaint.isPublic && !isAuthor && !isAdmin) {
    throw new ForbiddenError('비공개 민원은 작성자와 관리자만 볼 수 있습니다.');
  }

  await complaintRepository.incrementComplaintViewCount(complaintId);

  const updatedData: ComplaintWithAuthor = {
    ...(complaint as unknown as ComplaintWithAuthor),
    viewCount: complaint.viewCount + 1,
  };

  return formatComplaint(updatedData, { includeDetails: true });
}

export async function updateUserComplaint(
  complaintId: string,
  userId: string,
  data: UpdateUserComplaintDto,
): Promise<ComplaintListResponse> {
  await validateUserComplaintAccess(complaintId, userId);
  const updatedComplaint = await complaintRepository.updateUserComplaint(complaintId, data);
  return formatComplaint(updatedComplaint as unknown as ComplaintWithAuthor);
}

export async function deleteUserComplaint(complaintId: string, userId: string): Promise<void> {
  await validateUserComplaintAccess(complaintId, userId);
  await complaintRepository.deleteUserComplaint(complaintId);
}

export async function updateComplaintStatus(
  complaintId: string,
  data: UpdateComplaintStatusDto,
): Promise<ComplaintDetailResponse> {
  const updatedComplaint = await complaintRepository.updateComplaintStatus(
    complaintId,
    data.status,
  );
  return formatComplaint(updatedComplaint as unknown as ComplaintWithAuthor, {
    includeDetails: true,
  });
}
