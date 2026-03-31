import { EXPRESS } from '../libs/constants';
import * as pollController from './poll.controller';
import { catchAsync } from '../libs/catchAsync';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { Role } from '@prisma/client';
const pollRouter = EXPRESS.Router();

pollRouter.post('/', authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN), catchAsync(pollController.CreatePolls));

pollRouter.get('/', authenticate, catchAsync(pollController.GetAllPollList));

pollRouter.get('/:pollId', authenticate, catchAsync(pollController.GetPollInformation));
pollRouter.patch('/:pollId', authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN), catchAsync(pollController.UpdatePoll));
pollRouter.delete('/:pollId', authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN), catchAsync(pollController.DeletePoll));

export default pollRouter;