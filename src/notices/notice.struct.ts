import { NoticeCategory } from '@prisma/client';
import { superstruct, isUuid } from '../libs/constants';

// export const NoticeCategory = {
//     MAINTENANCE: 'MAINTENANCE',
//     EMERGENCY: 'EMERGENCY',
//     COMMUNITY: 'COMMUNITY',
//     RESIDENT_VOTE: 'RESIDENT_VOTE',
//     RESIDENT_COUNCIL: 'RESIDENT_COUNCIL',
//     ETC: 'ETC'
// } as const;

export const CreateNoticeStruct = superstruct.object({
    category: superstruct.enums(Object.values(NoticeCategory)),
    title: superstruct.size(superstruct.string(), 1, 100),
    content: superstruct.string(),
    // boardId는 서버에서 로그인 사용자(apartment) 기준으로 결정되므로 클라이언트 입력을 강제하지 않는다.
    boardId: superstruct.optional(
        superstruct.define('Uuid', (value) => typeof value === 'string' && isUuid.v4(value))
    ),
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
