import * as s from 'superstruct';
import { ExpressRequest, ExpressResponse } from '../libs/constants';
import * as commentService from './comment.services';
import { CreateCommentStruct, UpdateCommentStruct } from './comment.struct';
import BadRequestError from '../libs/errors/BadRequestError';

const getValidCommentId = (req: ExpressRequest): string => {
  const { commentId } = req.params;
  if (!commentId || typeof commentId !== 'string') {
    throw new BadRequestError('댓글 ID가 올바르지 않습니다.');
  }
  return commentId;
};

export async function createComment(req: ExpressRequest, res: ExpressResponse) {
  const authorId = req.user!.id;

  const data = s.create(req.body, CreateCommentStruct);
  const result = await commentService.createComment(authorId, data);

  return res.status(201).json(result);
}

export async function updateComment(req: ExpressRequest, res: ExpressResponse) {
  const authorId = req.user!.id;
  const commentId = getValidCommentId(req);

  const data = s.create(req.body, UpdateCommentStruct);
  const result = await commentService.updateComment(commentId, authorId, data);

  return res.status(200).json(result);
}

export async function deleteComment(req: ExpressRequest, res: ExpressResponse) {
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const commentId = getValidCommentId(req);
  await commentService.deleteComment(commentId, userId, userRole);

  return res.status(200).json({ message: '정상적으로 삭제 처리되었습니다' });
}
