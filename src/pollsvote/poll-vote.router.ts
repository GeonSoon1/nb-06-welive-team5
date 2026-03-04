import { EXPRESS } from '../libs/constants';
import { catchAsync } from '../libs/catchAsync';
import * as pollsVoteController from './poll-vote.controller';

const pollsVoteRouter = EXPRESS.Router();

pollsVoteRouter.post('/:optionId/vote', catchAsync(pollsVoteController.addVote));

pollsVoteRouter.delete('/:optionId/vote', catchAsync(pollsVoteController.cancelVote));

export default pollsVoteRouter;
