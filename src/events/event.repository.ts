import { prismaClient, Prisma, BoardType, NotificationType } from '../libs/constants';
import { CreateEventDto, EventWithRelations } from './event.types';

// 1. 이벤트 목록 조회
export async function findEvents(
    apartmentId: string,
    startDate: Date,
    endDate: Date,
): Promise<EventWithRelations[]> {
    return await prismaClient.event.findMany({
        where: {
            OR: [
                // Notice가 해당 아파트의 것인 경우
                { notice: { apartmentboard: { apartment: { id: apartmentId } } } },
                // Vote(Poll)가 해당 아파트의 것인 경우
                { vote: { apartmentboard: { apartment: { id: apartmentId } } } },
            ],
            // 조회 기간과 겹치는 이벤트 검색
            AND: [
                { startDate: { lte: endDate } },
                { endDate: { gte: startDate } },
            ],
        },
        include: {
            notice: true,
            vote: true,
        },
        orderBy: { startDate: 'asc' },
    });
}

// 2. 이벤트 생성 또는 업데이트 (Upsert 로직 구현)
export async function upsertEvent(
    data: CreateEventDto,
    tx?: Prisma.TransactionClient
) {
    const db = tx || prismaClient;
    const { boardType, boardId, startDate, endDate } = data;

    // Notice 또는 Vote ID로 기존 이벤트 검색
    const whereInput: Prisma.EventWhereInput =
        boardType === 'NOTICE' ? { noticeId: boardId } : { voteId: boardId };

    const existingEvent = await db.event.findFirst({
        where: whereInput,
    });

    if (existingEvent) {
        // 업데이트
        return await db.event.update({
            where: { id: existingEvent.id },
            data: { startDate, endDate },
        });
    } else {
        // 생성
        let title: string;
        let category: NotificationType;
        let apartmentId: string;
        let type: BoardType;

        if (boardType === 'NOTICE') {
            const notice = await db.notice.findUniqueOrThrow({
                where: { id: boardId },
                include: {
                    apartmentboard: {
                        include: { apartment: true },
                    },
                },
            });
            if (!notice.apartmentboard.apartment) throw new Error('Apartment not found');
            title = notice.title;
            category = NotificationType.NOTICE_REG;
            apartmentId = notice.apartmentboard.apartment.id;
            type = BoardType.NOTICE;
        } else {
            const vote = await db.vote.findUniqueOrThrow({
                where: { id: boardId },
                include: {
                    apartmentboard: {
                        include: { apartment: true },
                    },
                },
            });
            if (!vote.apartmentboard.apartment) throw new Error('Apartment not found');
            title = vote.title;
            category = NotificationType.VOTE_REG;
            apartmentId = vote.apartmentboard.apartment.id;
            type = BoardType.VOTE;
        }

        return await db.event.create({
            data: {
                startDate,
                endDate,
                title,
                type,
                category,
                apartmentId,
                noticeId: boardType === 'NOTICE' ? boardId : null,
                voteId: boardType === 'POLL' ? boardId : null,
            },
        });
    }
}

// 3. 이벤트 삭제
export async function deleteEvent(id: string) {
    return await prismaClient.event.delete({
        where: { id },
    });
}

// 4. 단일 조회 (존재 여부 확인용)
export async function findEventById(id: string) {
    return await prismaClient.event.findUnique({
        where: { id },
        include: { notice: true, vote: true },
    });
}
