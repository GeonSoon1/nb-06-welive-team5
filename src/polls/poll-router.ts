import { EXPRESS } from '../libs/constants.js';
import { pollController } from './poll-controller.js';
import { catchAsync } from '../libs/catchAsync.js';
const pollRouter = EXPRESS.Router();

pollRouter.post('/', catchAsync(pollController.CreatePolls));

pollRouter.get('/', catchAsync(pollController.GetAllPollList));

pollRouter.get('/:pollId', catchAsync(pollController.GetPollInfomation));
pollRouter.patch('/:pollId', catchAsync(pollController.UpdatePoll));
pollRouter.delete('/:pollId', catchAsync(pollController.DeletePoll));

export default pollRouter;