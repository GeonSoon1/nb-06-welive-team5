import cron from 'node-cron';
import * as pollRepository from '../polls/poll.repository';
import * as noticeService from '../notices/notice.service';

/**
 * 매분 0초마다 투표 상태(진행중, 마감)를 최신화하는 스케줄러
 * 서버 부하를 최소화하기 위해 API 호출 시가 아닌 백그라운드에서 주기적으로 실행됩니다.
 * 투표가 마감되면 해당 투표 결과에 대한 공지사항을 자동으로 생성합니다.
 */
export const startPollScheduler = () => {
    cron.schedule('* * * * *', async () => {
        try {
            const closedPolls = await pollRepository.updatePollStatuses();

            if (closedPolls && closedPolls.length > 0) {
                console.log(`[CRON_INFO] ${closedPolls.length}개의 투표가 마감되어 공지사항으로 등록합니다.`);
                for (const poll of closedPolls) {
                    await noticeService.createNoticeFromPoll(poll);
                }
            }
        } catch (error) {
            console.log('[CRON_ERROR] 투표 상태 스케줄러 실행 중 오류 발생:', error);
        }
    });
};
