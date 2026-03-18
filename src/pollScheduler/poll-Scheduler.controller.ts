import type { ExpressRequest, ExpressResponse, ExpressNextFunction } from '../libs/constants';
import * as pollRepository from '../polls/poll.repository';

export const checkSchedulerStatus = async (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
    try {
        // 실제로 투표 상태 업데이트(Lazy Update) 쿼리를 실행하여, 
        // 데이터베이스 연결 및 상태 갱신 로직이 정상적으로 작동하는지 테스트(Health Check)합니다.
        await pollRepository.updatePollStatuses();

        res.status(200).json({ message: "Poll scheduler is running." });
    } catch (error) {
        next(error);
    }
};
