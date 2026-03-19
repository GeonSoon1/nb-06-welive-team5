import { prismaClient as prisma, Prisma } from '../libs/constants';
import { UpdateUserComplaintDto, GetComplaintsQueryDto } from './complaint.struct';
import { ComplaintStatus } from '@prisma/client';

const authorSelectQuery = {
  select: {
    id: true,
    name: true,
    apartmentUnit: {
      select: { dong: true, ho: true },
    },
  },
};

export async function validateComplaintOwnership(
  complaintId: string,
  apartmentId: string,
): Promise<boolean> {
  const complaint = await prisma.complaint.findFirst({
    where: {
      id: complaintId,
      apartmentboard: { apartment: { id: apartmentId } },
    },
  });
  return !!complaint;
}

// 아파트 ID로 게시판 ID만 빼오는 조회 함수
export async function getBoardIdByApartment(apartmentId: string) {
  const apartment = await prisma.apartment.findUnique({
    where: { id: apartmentId },
    select: { apartmentboardId: true },
  });
  return apartment?.apartmentboardId;
}

// 1. 민원 등록
export async function createComplaint(
  authorId: string,
  apartmentboardId: string,
  data: { title: string; content: string; isPublic: boolean },
) {
  return await prisma.complaint.create({
    data: {
      title: data.title,
      content: data.content,
      isPublic: data.isPublic,
      authorId: authorId,
      apartmentboardId: apartmentboardId,
    },
    include: { author: authorSelectQuery },
  });
}

// 2. 전체 민원 목록 조회
export async function getComplaints(apartmentId: string, query: GetComplaintsQueryDto) {
  const { page, limit, status, isPublic, dong, ho, keyword } = query;

  const take = Math.min(Number(limit || 20), 100);
  const skip = (Math.max(Number(page || 1), 1) - 1) * take;

  const where: Prisma.ComplaintWhereInput = {
    apartmentboard: { apartment: { id: apartmentId } },
    ...(status && { status }),
    ...(isPublic !== undefined && { isPublic: isPublic === 'true' }),
    ...(keyword && {
      OR: [{ title: { contains: keyword } }, { content: { contains: keyword } }],
    }),
    ...((dong || ho) && {
      author: {
        apartmentUnit: {
          ...(dong && { dong }),
          ...(ho && { ho }),
        },
      },
    }),
  };

  const [complaints, totalCount] = await Promise.all([
    prisma.complaint.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { author: authorSelectQuery },
    }),
    prisma.complaint.count({ where }),
  ]);

  return { complaints, totalCount };
}

// 3. 민원 상세 조회 (댓글 포함)
export async function getComplaintDetail(id: string) {
  return await prisma.complaint.findUnique({
    where: { id },
    include: {
      author: authorSelectQuery,
      comments: {
        orderBy: { createdAt: 'asc' },
        include: {
          author: { select: { id: true, name: true } },
        },
      },
    },
  });
}

// 4. 조회수 1 증가
export async function incrementComplaintViewCount(id: string) {
  return await prisma.complaint.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });
}

// 5. 민원 단일 조회 (검증용)
export async function getComplaintById(id: string) {
  return await prisma.complaint.findUnique({
    where: { id },
  });
}

// 6. 일반 유저 민원 수정
export async function updateUserComplaint(id: string, data: UpdateUserComplaintDto) {
  return await prisma.complaint.update({
    where: { id },
    data: {
      title: data.title,
      content: data.content,
      isPublic: data.isPublic,
    },
    include: { author: authorSelectQuery },
  });
}

// 7. 일반 유저 민원 삭제
export async function deleteUserComplaint(id: string) {
  return await prisma.complaint.delete({
    where: { id },
  });
}

// 8. 관리자 민원 상태 수정
export async function updateComplaintStatus(id: string, status: ComplaintStatus) {
  return await prisma.complaint.update({
    where: { id },
    data: { status },
    include: {
      author: authorSelectQuery,
      comments: {
        orderBy: { createdAt: 'asc' },
        include: {
          author: { select: { id: true, name: true } },
        },
      },
    },
  });
}
