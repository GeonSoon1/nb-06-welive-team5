import * as s from 'superstruct';
import { ComplaintStatus } from '@prisma/client';

export const CreateComplaintStruct = s.object({
  title: s.size(s.string(), 1, 100),
  content: s.size(s.string(), 1, 2000),
  isPublic: s.boolean(),
});

export const UpdateUserComplaintStruct = s.object({
  title: s.optional(s.size(s.string(), 1, 100)),
  content: s.optional(s.size(s.string(), 1, 2000)),
  isPublic: s.optional(s.boolean()),
});

export const UpdateComplaintStatusStruct = s.object({
  status: s.enums([
    ComplaintStatus.PENDING,
    ComplaintStatus.IN_PROGRESS,
    ComplaintStatus.RESOLVED,
    ComplaintStatus.REJECTED,
  ]),
});

export const GetComplaintsQueryStruct = s.type({
  page: s.optional(s.string()),
  limit: s.optional(s.string()),
  status: s.optional(
    s.enums([
      ComplaintStatus.PENDING,
      ComplaintStatus.IN_PROGRESS,
      ComplaintStatus.RESOLVED,
      ComplaintStatus.REJECTED,
    ]),
  ),
  isPublic: s.optional(s.enums(['true', 'false'])),
  dong: s.optional(s.string()),
  ho: s.optional(s.string()),
  keyword: s.optional(s.string()),
});

export type CreateComplaintDto = s.Infer<typeof CreateComplaintStruct>;
export type UpdateUserComplaintDto = s.Infer<typeof UpdateUserComplaintStruct>;
export type UpdateComplaintStatusDto = s.Infer<typeof UpdateComplaintStatusStruct>;
export type GetComplaintsQueryDto = s.Infer<typeof GetComplaintsQueryStruct>;
