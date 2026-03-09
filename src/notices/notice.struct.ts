import { superstruct, isUuid } from '../libs/constants';

export const NoticeCategory = {
    MAINTENANCE: 'MAINTENANCE',
    EMERGENCY: 'EMERGENCY',
    COMMUNITY: 'COMMUNITY',
    RESIDENT_VOTE: 'RESIDENT_VOTE',
    RESIDENT_COUNCIL: 'RESIDENT_COUNCIL',
    ETC: 'ETC'
} as const;

export const CreateNoticeStruct = superstruct.object({
    category: superstruct.enums(Object.values(NoticeCategory)),
    title: superstruct.size(superstruct.string(), 1, 100),
    content: superstruct.string(),
    boardId: superstruct.define('Uuid', (value) => typeof value === 'string' && isUuid.v4(value)),
    isPinned: superstruct.boolean(),
    startDate: superstruct.optional(superstruct.coerce(superstruct.date(), superstruct.string(), (date) => new Date(date))),
    endDate: superstruct.optional(superstruct.coerce(superstruct.date(), superstruct.string(), (date) => new Date(date))),
});

export type CreateNoticeDto = superstruct.Infer<typeof CreateNoticeStruct>;

export const UpdateNoticeStruct = superstruct.partial(CreateNoticeStruct);

export type UpdateNoticeDto = superstruct.Infer<typeof UpdateNoticeStruct>;

export const GetNoticeListQuery = superstruct.object({
    page: superstruct.defaulted(superstruct.coerce(superstruct.number(), superstruct.string(), (v) => Number(v)), 1),
    limit: superstruct.defaulted(superstruct.coerce(superstruct.number(), superstruct.string(), (v) => Number(v)), 11),
    category: superstruct.optional(superstruct.enums(Object.values(NoticeCategory))),
    search: superstruct.optional(superstruct.string()),
});

export type GetNoticeListDto = superstruct.Infer<typeof GetNoticeListQuery>;