import { checkSchedulerStatus } from '../src/pollScheduler/poll-Scheduler.controller';
import * as pollRepository from '../src/polls/poll.repository';
import type { ExpressRequest, ExpressResponse, ExpressNextFunction } from '../src/libs/constants';

jest.mock('../src/polls/poll.repository');

describe('PollScheduler Controller', () => {
    let req: Partial<ExpressRequest>;
    let res: Partial<ExpressResponse>;
    let next: jest.Mock;

    beforeEach(() => {
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
    });

    it('정상적으로 스케줄러 상태를 갱신하고 200 상태코드를 반환해야 한다', async () => {
        // Given
        (pollRepository.updatePollStatuses as jest.Mock).mockResolvedValue(true);

        // When
        await checkSchedulerStatus(req as ExpressRequest, res as ExpressResponse, next as ExpressNextFunction);

        // Then
        expect(pollRepository.updatePollStatuses).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: 'Poll scheduler is running.' });
    });

    it('에러 발생 시 next(error)를 호출해야 한다', async () => {
        // Given
        const error = new Error('Database connection failed');
        (pollRepository.updatePollStatuses as jest.Mock).mockRejectedValue(error);

        // When
        await checkSchedulerStatus(req as ExpressRequest, res as ExpressResponse, next as ExpressNextFunction);

        // Then
        expect(next).toHaveBeenCalledWith(error);
        expect(res.status).not.toHaveBeenCalled();
    });
});