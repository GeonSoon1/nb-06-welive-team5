import { EXPRESS } from './libs/constants';

import userRouter from './users/userrouter';
import apartmentRouter from './apartments/apartmentrouter';
import noticeRouter from './notices/noticerouter';
import complaintRouter from './complaints/complaintrouter';
import voteRouter from './polls/pollrouter';
import residentRouter from './residents/residentrouter';
import commentRouter from './comments/commentrouter';
import notificationRouter from './notifications/notificationrouter';
import eventRouter from './events/eventrouter';
import authRouter from './auth/authrouter';
import pollsVoteRouter from './pollsvote/pollsvoterouter';
import pollSchedulerRouter from './pollScheduler/pollSchedulerrouter';

export const routerManager = EXPRESS.Router();

//인증관리
routerManager.use('/auth', authRouter);

//사용자관리
routerManager.use('/users', userRouter);

//아파트 관리
routerManager.use('/apartments', apartmentRouter);

//입주민 관리
routerManager.use('/residents', residentRouter);

//민원 관리
routerManager.use('/complaints', complaintRouter);

//투표관리
routerManager.use('/polls', voteRouter);

//공지사항관리
routerManager.use('/notices', noticeRouter);

//댓글관리
routerManager.use('/comments', commentRouter);

//알림관리
routerManager.use('/notifications', notificationRouter);

//이벤트관리
routerManager.use('/event', eventRouter);

//투표하기 관리
routerManager.use('/options', pollsVoteRouter);

//poll 스케줄러 상태 확인(개발용)
routerManager.use('/poll-scheduler', pollSchedulerRouter);
