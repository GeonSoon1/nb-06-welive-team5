import { PrismaEvent, Notice, Vote } from '../libs/constants';

export type EventBoardType = 'NOTICE' | 'POLL';

export interface GetEventsQuery {
    apartmentId: string;
    year: number;
    month: number;
}

export interface CreateEventDto {
    boardType: EventBoardType;
    boardId: string;
    startDate: Date;
    endDate: Date;
}

export interface EventListResponse {
    id: string;
    start: Date;
    end: Date;
    title: string;
    category: string;
    type: EventBoardType;
}

// Prisma Include 결과를 위한 타입 정의
export type EventWithRelations = PrismaEvent & {
    notice?: (Notice & { category?: string | null; }) | null;
    vote?: (Vote & { title: string; }) | null;
};
