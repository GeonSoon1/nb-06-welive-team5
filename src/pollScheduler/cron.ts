import cron from 'node-cron';
import * as pollRepository from '../polls/poll.repository';

/**
 * 매분 0초마다 투표 상태(진행중, 마감)를 최신화하는 스케줄러
 * 서버 부하를 최소화하기 위해 API 호출 시가 아닌 백그라운드에서 주기적으로 실행됩니다.
 */
export const startPollScheduler = () => {
    cron.schedule('* * * * *', async () => {
        try {
            await pollRepository.updatePollStatuses();
        } catch (error) {
            console.error('투표 상태 스케줄러 실행 중 오류 발생:', error);
        }
    });
};
