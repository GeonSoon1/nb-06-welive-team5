import { EXPRESS } from '../libs/constants';
import * as pollSchedulerController from './poll-Scheduler.controller';
import { authenticate } from '../middlewares/authenticate';
import { catchAsync } from '../libs/catchAsync';

const pollSchedulerRouter = EXPRESS.Router();
// -todo 아무나받지 못하도록 인증 추가
pollSchedulerRouter.get('/ping', authenticate, catchAsync(pollSchedulerController.checkSchedulerStatus));

export default pollSchedulerRouter;