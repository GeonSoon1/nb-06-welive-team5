import { EXPRESS } from '../libs/constants';
import * as pollController from './poll.controller';
import { catchAsync } from '../libs/catchAsync';
const pollRouter = EXPRESS.Router();

pollRouter.post('/', catchAsync(pollController.CreatePolls));

pollRouter.get('/', catchAsync(pollController.GetAllPollList));

pollRouter.get('/:pollId', catchAsync(pollController.GetPollInfomation));
pollRouter.patch('/:pollId', catchAsync(pollController.UpdatePoll));
pollRouter.delete('/:pollId', catchAsync(pollController.DeletePoll));

export default pollRouter;