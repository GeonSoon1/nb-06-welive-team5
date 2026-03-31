import { BoardType } from '@prisma/client';
import { prismaClient as prisma } from '../libs/constants';
import { CreateCommentDto } from './comment.struct';

export async function validateBoardOwnership(
  boardId: string,
  boardType: BoardType,
  apartmentId: string,
): Promise<boolean> {
  if (!apartmentId) return false;

  const whereClause = {
    id: boardId,
    apartmentboard: { apartment: { id: apartmentId } },
  };

  let board;
  if (boardType === BoardType.COMPLAINT)
    board = await prisma.complaint.findFirst({ where: whereClause });
  else if (boardType === BoardType.NOTICE)
    board = await prisma.notice.findFirst({ where: whereClause });
  else if (boardType === BoardType.VOTE)
    board = await prisma.vote.findFirst({ where: whereClause });

  return !!board;
}

export async function createComment(authorId: string, data: CreateCommentDto) {
  const { content, boardType, boardId } = data;

  // 트랜잭션을 사용하여 댓글 생성과 카운트 증가를 동시에 처리
  return await prisma.$transaction(async (tx) => {
    // 1. 댓글 생성
    const newComment = await tx.comment.create({
      data: {
        content,
        authorId,
        ...(boardType === BoardType.COMPLAINT && { complaintId: boardId }),
        ...(boardType === BoardType.NOTICE && { noticeId: boardId }),
        ...(boardType === BoardType.VOTE && { voteId: boardId }),
      },
      include: {
        author: { select: { name: true } },
      },
    });

    // 2. 게시글의 댓글 수 1 증가 (increment)
    if (boardType === BoardType.COMPLAINT) {
      await tx.complaint.update({
        where: { id: boardId },
        data: { commentsCount: { increment: 1 } },
      });
    } else if (boardType === BoardType.NOTICE) {
      await tx.notice.update({
        where: { id: boardId },
        data: { commentsCount: { increment: 1 } },
      });
    }

    return newComment;
  });
}

export async function getCommentById(id: string) {
  return prisma.comment.findUnique({
    where: { id },
    include: {
      author: { select: { name: true } },
    },
  });
}

export async function getCommentApartmentIdById(id: string) {
  return prisma.comment.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          apartmentId: true
        }
      },
    },
  });
}

export async function updateComment(id: string, content: string) {
  return prisma.comment.update({
    where: { id },
    data: { content },
    include: { author: { select: { name: true } } },
  });
}

export async function deleteComment(id: string) {
  // 트랜잭션을 사용하여 댓글 삭제와 카운트 감소를 동시에 처리
  await prisma.$transaction(async (tx) => {
    // 1. 삭제할 댓글 조회 (어떤 게시판 소속인지 확인하기 위해)
    const comment = await tx.comment.findUnique({ where: { id } });
    if (!comment) return; // 이미 삭제되었거나 없는 댓글이면 종료

    // 2. 댓글 삭제
    await tx.comment.delete({ where: { id } });

    // 3. 소속된 게시판의 댓글 수 1 감소 (decrement)
    if (comment.complaintId) {
      await tx.complaint.update({
        where: { id: comment.complaintId },
        data: { commentsCount: { decrement: 1 } },
      });
    } else if (comment.noticeId) {
      await tx.notice.update({
        where: { id: comment.noticeId },
        data: { commentsCount: { decrement: 1 } },
      });
    }
  });
}