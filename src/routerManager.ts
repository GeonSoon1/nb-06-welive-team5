import { EXPRESS } from './libs/constants';

//아직 사용되지 않은 것 같아 잠시 주석처리
import userRouter from './users/user.router';
import apartmentRouter from './apartments/apartment.router';
import noticeRouter from './notices/notice.router';
import complaintRouter from './complaints/complaint.router';
import pollRouter from './polls/poll.router';
import residentRouter from './residents/resident.router';
import commentRouter from './comments/commentrouter';
import notificationRouter from './notifications/notification.router';
import eventRouter from './events/event.router';
import pollsVoteRouter from './pollsvote/poll-vote.router';
import authRouter from './auth/auth.router';
//미개발 잠시 주석처리(담당: 유인학)
// import pollSchedulerRouter from './pollScheduler/poll-Scheduler.router';

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
routerManager.use('/polls', pollRouter);

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
// routerManager.use('/poll-scheduler', pollSchedulerRouter);
