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
        await checkSchedulerStatus(req as ExpressRequest, res as ExpressResponse);

        // Then
        expect(pollRepository.updatePollStatuses).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: 'Poll scheduler is running.' });
    });
});