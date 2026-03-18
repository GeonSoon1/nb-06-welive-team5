import * as s from 'superstruct';
import { BoardType } from '@prisma/client';

const Uuid = s.pattern(
  s.string(),
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
);

export const CreateCommentStruct = s.object({
  content: s.size(s.string(), 1, 1000),
  boardType: s.enums([BoardType.COMPLAINT, BoardType.NOTICE, BoardType.VOTE]),
  boardId: Uuid,
});

export const UpdateCommentStruct = s.object({
  content: s.size(s.string(), 1, 1000),
  boardType: s.enums([BoardType.COMPLAINT, BoardType.NOTICE, BoardType.VOTE]),
  boardId: Uuid,
});

export type CreateCommentDto = s.Infer<typeof CreateCommentStruct>;
export type UpdateCommentDto = s.Infer<typeof UpdateCommentStruct>;
