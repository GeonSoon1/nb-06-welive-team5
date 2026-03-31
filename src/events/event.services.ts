import * as eventRepository from './event.repository';
import { CreateEventDto, EventListResponse, GetEventsQuery } from './event.types';
import BadRequestError from '../libs/errors/BadRequestError';
import NotFoundError from '../libs/errors/NotFoundError';

// 1. 이벤트 목록 조회
export async function getEventList(query: GetEventsQuery): Promise<EventListResponse[]> {
    const { apartmentId, year, month } = query;

    // 해당 월의 시작일과 종료일 계산 (Local Time 기준 00:00:00 ~ 23:59:59)
    // 입력받은 year, month를 기준으로 날짜 범위 생성
    const startDate = new Date(year, Number(month) - 1, 1);
    const endDate = new Date(year, Number(month), 0); // 다음달의 0일 = 이번달의 마지막날
    endDate.setHours(23, 59, 59, 999);

    const events = await eventRepository.findEvents(apartmentId, startDate, endDate);

    // 응답 포맷 매핑
    return events.map((event) => {
        let title = '';
        let category = 'GENERAL';
        let type: 'NOTICE' | 'POLL' = 'NOTICE';

        if (event.notice) {
            title = event.notice.title;
            category = event.notice.category || 'GENERAL';
            type = 'NOTICE';
        } else if (event.vote) {
            title = event.vote.title;
            category = 'VOTE'; // 투표는 별도 카테고리가 없다면 고정값 사용
            type = 'POLL';
        }

        return {
            id: event.id,
            start: event.startDate,
            end: event.endDate,
            title,
            category,
            type,
        };
    });
}

// 2. 이벤트 생성 또는 업데이트
export async function createOrUpdateEvent(data: CreateEventDto) {
    // 시작일이 종료일보다 늦은 경우 예외 처리
    if (data.startDate > data.endDate) {
        throw new BadRequestError('종료일은 시작일보다 빠를 수 없습니다.');
    }

    await eventRepository.upsertEvent(data);
}

// 3. 이벤트 삭제
export async function deleteEvent(eventId: string) {
    const event = await eventRepository.findEventById(eventId);
    if (!event) {
        throw new NotFoundError('존재하지 않는 이벤트입니다.');
    }

    const deleted = await eventRepository.deleteEvent(eventId);

    return {
        id: deleted.id,
        startDate: deleted.startDate,
        endDate: deleted.endDate,
        boardType: deleted.noticeId ? 'NOTICE' : 'POLL',
        noticeId: deleted.noticeId,
        pollId: deleted.voteId,
    };
}
