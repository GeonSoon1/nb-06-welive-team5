import { EXPRESS } from '../libs/constants.js';
import { catchAsync } from '../libs/catchAsync.js';
import * as pollsVoteController from './poll-vote.controller.js';

const pollsVoteRouter = EXPRESS.Router();

pollsVoteRouter.post('/:optionId/vote', catchAsync(pollsVoteController.addVote));

pollsVoteRouter.delete('/:optionId/vote', catchAsync(pollsVoteController.cancelVote));

export default pollsVoteRouter;
