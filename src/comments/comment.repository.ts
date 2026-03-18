import { Prisma } from '@prisma/client';
import { prismaClient as prisma } from '../libs/constants';
import { CreateCommentDto } from './comment.struct';

export async function createComment(authorId: string, data: CreateCommentDto) {
  return await prisma.$transaction(async (tx) => {
    const commentData: Prisma.CommentUncheckedCreateInput = {
      content: data.content,
      authorId: authorId,
    };

    if (data.boardType === 'COMPLAINT') {
      commentData.complaintId = data.boardId;
      await tx.complaint.update({
        where: { id: data.boardId },
        data: { commentsCount: { increment: 1 } },
      });
    } else if (data.boardType === 'NOTICE') {
      commentData.noticeId = data.boardId;
      await tx.notice.update({
        where: { id: data.boardId },
        data: { commentsCount: { increment: 1 } },
      });
    } else if (data.boardType === 'VOTE') {
      commentData.voteId = data.boardId;
    }

    return await tx.comment.create({
      data: commentData,
      include: { author: { select: { name: true } } },
    });
  });
}

export async function getCommentById(id: string) {
  return await prisma.comment.findUnique({
    where: { id },
    include: { author: { select: { id: true, name: true } } },
  });
}

export async function updateComment(id: string, content: string) {
  return await prisma.comment.update({
    where: { id },
    data: { content },
    include: { author: { select: { name: true } } },
  });
}

export async function deleteComment(commentId: string, boardType: string, boardId: string) {
  return await prisma.$transaction(async (tx) => {
    await tx.comment.delete({
      where: { id: commentId },
    });

    if (boardType === 'COMPLAINT') {
      await tx.complaint.update({
        where: { id: boardId },
        data: { commentsCount: { decrement: 1 } },
      });
    } else if (boardType === 'NOTICE') {
      await tx.notice.update({
        where: { id: boardId },
        data: { commentsCount: { decrement: 1 } },
      });
    }
  });
}
