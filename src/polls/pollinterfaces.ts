import { VoteStatus } from './pollstruct';


export interface PollType {
    id: string;
    title: string;
    content: string;
    targetScope: number;
    startTime: Date;
    endTime: Date;
    status: VoteStatus;

    authorId: string;
    //author : user //유저 정보를 할당해야함
    apartmentboardId: String;

    createdAt: Date;

}