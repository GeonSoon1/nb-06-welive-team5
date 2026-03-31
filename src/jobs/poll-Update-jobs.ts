import cron from 'node-cron';
import * as pollRepository from '../polls/poll.repository';
import * as noticeService from '../notices/notice.service';
export const startPollScheduler = () => {
    cron.schedule('* * * * *', async () => {
        try {
            const closedPolls = await pollRepository.updatePollStatuses();

            if (closedPolls && closedPolls.length > 0) {
                console.log(`[CRON_INFO] ${closedPolls.length}개 작업 처리 시작`);

                // 모든 공지 생성을 병렬로 실행하여 시간 단축
                const results = await Promise.allSettled(
                    closedPolls.map(poll => noticeService.createNoticeFromPoll(poll))
                );

                // 실패한 작업만 필터링해서 로그 남기기
                results.forEach((res, idx) => {
                    if (res.status === 'rejected') {
                        console.error(`[CRON_ERROR] ${idx}번째 공지 생성 실패:`, res.reason);
                    }
                });
            }
        } catch (error) {
            console.log('[CRON_ERROR] 스케줄러 실행 중 오류:', error);
        }
    });
};