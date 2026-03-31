import * as pollService from '../src/polls/poll.services';
import * as pollRepository from '../src/polls/poll.repository';
import { CustomError } from '../src/libs/errors/errorHandler';
import { Role } from '@prisma/client';

import { prismaClient } from '../src/libs/constants';

jest.mock('../src/polls/poll.repository');

jest.mock('../src/libs/constants', () => ({
    prismaClient: {
        vote: {
            findFirst: jest.fn(),
        },
    },
}));
describe('Polls Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const dummyPoll = {
        id: 'poll-123',
        title: '새로운 주차 규정 투표',
        status: 'IN_PROGRESS',
        authorId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        startDate: new Date(),
        endDate: new Date(),
        content: '내용',
        apartmentboardId: 'board-1',
        voteOptions: [{ id: 'opt-1', content: '찬성', voteCount: 10 }],
        author: { name: '홍길동' },
    };

    describe('getPollById', () => {
        it('단일 투표 정보를 성공적으로 가져와야 한다', async () => {
            // Given
            (pollRepository.findPollById as jest.Mock).mockResolvedValue(dummyPoll);
            (prismaClient.vote.findFirst as jest.Mock).mockResolvedValue(dummyPoll);

            // When
            const result = await pollService.getPollById('poll-123', "board-1", Role.USER);

            // Then
            expect(pollRepository.findPollById).toHaveBeenCalledWith('poll-123');
            expect(result.pollId).toBe('poll-123');
            expect(result.status).toBe('IN_PROGRESS');
            expect(result.options[0]?.title).toBe('찬성');
        });

        it('투표를 찾을 수 없으면 CustomError(404)를 발생시켜야 한다', async () => {
            (pollRepository.findPollById as jest.Mock).mockResolvedValue(null);

            await expect(pollService.getPollById('invalid-poll', "board-1", Role.USER)).rejects.toThrow(CustomError);
        });
    });
});