import * as commentRepository from './comment.repository';
import { CreateCommentDto, UpdateCommentDto } from './comment.struct';
import BadRequestError from '../libs/errors/BadRequestError';
import NotFoundError from '../libs/errors/NotFoundError';
import ForbiddenError from '../libs/errors/ForbiddenError';

interface CommentWithAuthor {
  id: string;
  authorId: string | null;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  complaintId?: string | null;
  noticeId?: string | null;
  voteId?: string | null;
  author?: { name: string } | null;
}

const formatCommentResponse = (comment: CommentWithAuthor, boardId: string, boardType: string) => ({
  comment: {
    id: comment.id,
    userId: comment.authorId || '',
    content: comment.content,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    writerName: comment.author?.name || '알 수 없음',
  },
  board: {
    id: boardId,
    boardType: boardType,
  },
});

export async function createComment(authorId: string, data: CreateCommentDto) {
  const newComment = await commentRepository.createComment(authorId, data);
  if (!newComment) throw new BadRequestError('댓글 등록에 실패했습니다.');

  return formatCommentResponse(newComment, data.boardId, data.boardType);
}

export async function updateComment(commentId: string, authorId: string, data: UpdateCommentDto) {
  const comment = await commentRepository.getCommentById(commentId);
  if (!comment) throw new NotFoundError('해당 댓글을 찾을 수 없습니다.');
  if (comment.authorId !== authorId)
    throw new ForbiddenError('자신이 작성한 댓글만 수정할 수 있습니다.');

  const updatedComment = await commentRepository.updateComment(commentId, data.content);
  return formatCommentResponse(updatedComment, data.boardId, data.boardType);
}

export async function deleteComment(commentId: string, userId: string, userRole: string) {
  const comment = await commentRepository.getCommentById(commentId);

  if (!comment) throw new NotFoundError('해당 댓글을 찾을 수 없습니다.');

  const isAuthor = comment.authorId === userId;
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  if (!isAuthor && !isAdmin) {
    throw new ForbiddenError('자신이 작성한 댓글만 삭제할 수 있습니다.');
  }

  const boardId = comment.complaintId || comment.noticeId || comment.voteId || '';
  const boardType = comment.complaintId ? 'COMPLAINT' : comment.noticeId ? 'NOTICE' : 'VOTE';

  await commentRepository.deleteComment(commentId, boardType, boardId);
}
