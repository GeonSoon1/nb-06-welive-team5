import { EXPRESS } from '../libs/constants';
import * as pollSchedulerController from './poll-Scheduler.controller';

const pollSchedulerRouter = EXPRESS.Router();

pollSchedulerRouter.get('/ping', pollSchedulerController.checkSchedulerStatus);

export default pollSchedulerRouter;