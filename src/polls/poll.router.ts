import { EXPRESS } from '../libs/constants';
import * as pollController from './poll.controller';
import { catchAsync } from '../libs/catchAsync';
import { authenticate } from '../middlewares/authenticate';
//추후 프론트 엔드 코드 보고 수정, 관리자만 투표들 생성이 가능한지 확인
// import { authorize } from '../middlewares/authorize';
const pollRouter = EXPRESS.Router();

pollRouter.post('/', authenticate, catchAsync(pollController.CreatePolls));

pollRouter.get('/', authenticate, catchAsync(pollController.GetAllPollList));

pollRouter.get('/:pollId', authenticate, catchAsync(pollController.GetPollInformation));
pollRouter.patch('/:pollId', authenticate, catchAsync(pollController.UpdatePoll));
pollRouter.delete('/:pollId', authenticate, catchAsync(pollController.DeletePoll));

export default pollRouter;