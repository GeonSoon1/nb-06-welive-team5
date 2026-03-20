import { BoardType } from '@prisma/client';
import { prismaClient as prisma } from '../libs/constants';
import { CreateCommentDto } from './comment.struct';

export async function validateBoardOwnership(
  boardId: string,
  boardType: BoardType,
  apartmentId: string,
): Promise<boolean> {
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

  return prisma.comment.create({
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
}

export async function getCommentById(id: string) {
  return prisma.comment.findUnique({
    where: { id },
    include: {
      author: { select: { name: true } },
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
  await prisma.comment.delete({ where: { id } });
}
