import * as pollsvoteService from '../src/pollsvote/poll-vote.service';
import * as pollsvoteRepository from '../src/pollsvote/poll-vote.repository';
import { CustomError } from '../src/libs/errors/errorHandler';

jest.mock('../src/pollsvote/poll-vote.repository');

describe('PollsVote Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('addVote', () => {
        it('이미 투표한 유저가 다시 투표하려고 하면 CustomError(409)를 발생시켜야 한다', async () => {
            // Given: 유효한 투표 정보 반환, 하지만 이미 투표 내역이 존재함
            const mockOption = {
                vote: {
                    id: 'poll-1',
                    apartmentboardId: 'board-1',
                    endTime: new Date(Date.now() + 100000), // 종료되지 않음
                    status: 'IN_PROGRESS'
                }
            };
            (pollsvoteRepository.findOptionWithVote as jest.Mock).mockResolvedValue(mockOption);
            (pollsvoteRepository.findUserVote as jest.Mock).mockResolvedValue({ id: 'vote-1' });

            // When & Then (Exception Testing)
            await expect(pollsvoteService.addVote('opt-2', 'user-1')).rejects.toThrow(CustomError);
            await expect(pollsvoteService.addVote('opt-2', 'user-1')).rejects.toMatchObject({ statusCode: 409 });
        });

        it('존재하지 않는 투표 옵션에 투표하면 CustomError(404)를 발생시켜야 한다', async () => {
            // Given
            (pollsvoteRepository.findOptionWithVote as jest.Mock).mockResolvedValue(null);

            // When & Then
            await expect(pollsvoteService.addVote('invalid-opt', 'user-1')).rejects.toThrow(CustomError);
            await expect(pollsvoteService.addVote('invalid-opt', 'user-1')).rejects.toMatchObject({ statusCode: 404 });
        });
    });
});