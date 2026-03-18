import * as eventService from '../src/events/event.services';
import * as eventRepository from '../src/events/event.repository';
import BadRequestError from '../src/libs/errors/BadRequestError';

// event.repository의 모든 함수를 모킹합니다.
jest.mock('../src/events/event.repository');

describe('Event Service', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getEventList', () => {
        it('해당 월의 이벤트 목록을 올바른 포맷으로 매핑하여 반환해야 한다', async () => {
            // Given
            const query = { apartmentId: 'apt-1', year: 2026, month: 3 };
            const mockDbEvents = [
                {
                    id: 'event-1',
                    startDate: new Date('2026-03-01'),
                    endDate: new Date('2026-03-05'),
                    notice: { title: '3월 반상회', category: 'GENERAL' },
                },
            ];
            (eventRepository.findEvents as jest.Mock).mockResolvedValue(mockDbEvents);

            // When
            const result = await eventService.getEventList(query);

            // Then
            expect(eventRepository.findEvents).toHaveBeenCalled();
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                id: 'event-1',
                start: mockDbEvents[0]?.startDate,
                end: mockDbEvents[0]?.endDate,
                title: '3월 반상회',
                category: 'GENERAL',
                type: 'NOTICE',
            });
        });
    });

    describe('createOrUpdateEvent', () => {
        it('시작일이 종료일보다 늦으면 BadRequestError를 던져야 한다', async () => {
            // Given
            const data = {
                boardType: 'NOTICE' as const,
                boardId: 'board-1',
                startDate: new Date('2026-03-10'),
                endDate: new Date('2026-03-05'), // 잘못된 날짜
            };

            // When & Then
            await expect(eventService.createOrUpdateEvent(data)).rejects.toThrow(BadRequestError);
        });
    });
});