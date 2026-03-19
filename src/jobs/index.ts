import cron from 'node-cron';
import { cleanupS3Files } from './cleanupS3';

// 매일 새벽 3시 0분에 실행 (0 3 * * *)
export function initScheduler(): void {
  cron.schedule('0 3 * * *', async () => {
    try {
      await cleanupS3Files();
    } catch (err) {
      console.log('[CRON_ERROR] S3 Cleanup 작업 중 치명적 오류:', err);
    }
  });

  console.log('All Cron Jobs Initialized.');
}
