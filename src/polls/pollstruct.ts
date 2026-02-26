import { superstruct, isUuid } from './../libs/constants';

export enum VoteStatus {
    PENDING = 'PENDING', //투표전
    IN_PROGRESS = 'IN_PROGRESS', //투표중
    CLOSED = 'CLOSED', //마감
}

export const CreatePollStruct = superstruct.object({
    boardId: superstruct.define('Uuid', (value) => typeof value === 'string' && isUuid.v4(value)),
    status: superstruct.enums(Object.values(VoteStatus)),
    title: superstruct.size(superstruct.string(), 1, 100),

});
