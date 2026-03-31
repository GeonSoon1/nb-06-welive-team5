import { EXPRESS } from '../libs/constants';
import { catchAsync } from '../libs/catchAsync';
import * as pollsVoteController from './poll-vote.controller';
import { authenticate } from '../middlewares/authenticate';

const pollsVoteRouter = EXPRESS.Router();

pollsVoteRouter.post('/:optionId/vote', authenticate, catchAsync(pollsVoteController.addVote));

pollsVoteRouter.delete('/:optionId/vote', authenticate, catchAsync(pollsVoteController.cancelVote));

export default pollsVoteRouter;
