import { superstruct, isUuid } from '../libs/constants';

export enum VoteStatus {
    PENDING = 'PENDING', //투표전
    IN_PROGRESS = 'IN_PROGRESS', //투표중
    CLOSED = 'CLOSED', //마감
}

export const CreatePollStruct = superstruct.object({
    boardId: superstruct.define('Uuid', (value) => typeof value === 'string' && isUuid.v4(value)),
    status: superstruct.enums(Object.values(VoteStatus)),
    title: superstruct.size(superstruct.string(), 1, 100),
    content: superstruct.string(),
    buildingPermission: superstruct.integer(),
    startDate: superstruct.coerce(superstruct.date(), superstruct.string(), (date) => new Date(date)),
    endDate: superstruct.coerce(superstruct.date(), superstruct.string(), (date) => new Date(date)),
    options: superstruct.array(
        superstruct.object({
            title: superstruct.string(),
        })
    ),
});

export type CreatePollDto = superstruct.Infer<typeof CreatePollStruct>;

export const GetPollListQuery = superstruct.object({
    page: superstruct.defaulted(superstruct.coerce(superstruct.number(), superstruct.string(), (v) => Number(v)), 1),
    limit: superstruct.defaulted(superstruct.coerce(superstruct.number(), superstruct.string(), (v) => Number(v)), 10),
    buildingPermission: superstruct.optional(superstruct.coerce(superstruct.number(), superstruct.string(), (v) => Number(v))),
    status: superstruct.optional(superstruct.enums(Object.values(VoteStatus))),
    keyword: superstruct.optional(superstruct.string()),
});



export type GetPollListDto = superstruct.Infer<typeof GetPollListQuery>;

export const UpdatePollStruct = superstruct.partial(superstruct.object({
    status: superstruct.enums(Object.values(VoteStatus)),
    title: superstruct.size(superstruct.string(), 1, 100),
    content: superstruct.string(),
    buildingPermission: superstruct.integer(),
    startDate: superstruct.coerce(superstruct.date(), superstruct.string(), (date) => new Date(date)),
    endDate: superstruct.coerce(superstruct.date(), superstruct.string(), (date) => new Date(date)),
    options: superstruct.array(
        superstruct.object({
            id: superstruct.optional(superstruct.define('Uuid', (value) => typeof value === 'string' && isUuid.v4(value))),
            title: superstruct.string(),
        })
    ),
}));

export type UpdatePollDto = superstruct.Infer<typeof UpdatePollStruct>;
