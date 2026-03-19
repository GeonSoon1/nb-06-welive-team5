import * as commentRepository from './comment.repository';
import { CreateCommentDto, UpdateCommentDto } from './comment.struct';
import { CommentWithAuthor, FormattedCommentResponse } from './comment.type';
import BadRequestError from '../libs/errors/BadRequestError';
import NotFoundError from '../libs/errors/NotFoundError';
import ForbiddenError from '../libs/errors/ForbiddenError';
import { Role } from '@prisma/client';

const formatCommentResponse = (comment: CommentWithAuthor): FormattedCommentResponse => {
  const boardId = comment.complaintId || comment.noticeId || comment.voteId || '';
  const boardType = comment.complaintId ? 'COMPLAINT' : comment.noticeId ? 'NOTICE' : 'VOTE';

  return {
    comment: {
      id: comment.id,
      userId: comment.authorId || '',
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      writerName: comment.author?.name || '알 수 없음',
    },
    board: { id: boardId, boardType },
  };
};

export async function createComment(authorId: string, apartmentId: string, data: CreateCommentDto) {
  const isOwner = await commentRepository.validateBoardOwnership(
    data.boardId,
    data.boardType,
    apartmentId,
  );
  if (!isOwner) throw new ForbiddenError('해당 게시글에 접근 권한이 없습니다.');

  const newComment = await commentRepository.createComment(authorId, data);
  if (!newComment) throw new BadRequestError('댓글 등록에 실패했습니다.');

  return formatCommentResponse(newComment as CommentWithAuthor);
}

export async function updateComment(
  commentId: string,
  authorId: string,
  apartmentId: string,
  data: UpdateCommentDto,
) {
  const comment = (await commentRepository.getCommentById(commentId)) as CommentWithAuthor;
  if (!comment) throw new NotFoundError('해당 댓글을 찾을 수 없습니다.');

  if (comment.authorId !== authorId)
    throw new ForbiddenError('자신이 작성한 댓글만 수정할 수 있습니다.');

  const isOwner = await commentRepository.validateBoardOwnership(
    data.boardId,
    data.boardType,
    apartmentId,
  );
  if (!isOwner) throw new ForbiddenError('해당 게시글에 접근 권한이 없습니다.');

  const updatedComment = await commentRepository.updateComment(commentId, data.content);
  return formatCommentResponse(updatedComment as CommentWithAuthor);
}

export async function deleteComment(commentId: string, userId: string, userRole: string) {
  const comment = (await commentRepository.getCommentById(commentId)) as CommentWithAuthor;
  if (!comment) throw new NotFoundError('해당 댓글을 찾을 수 없습니다.');

  const isAuthor = comment.authorId === userId;
  const isAdmin = userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN;

  if (!isAuthor && !isAdmin) throw new ForbiddenError('삭제 권한이 없습니다.');

  await commentRepository.deleteComment(commentId);
}
