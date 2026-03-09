import { EXPRESS } from '../libs/constants';
import { catchAsync } from '../libs/catchAsync';
import * as noticeController from './notice.controller';

const noticeRouter = EXPRESS.Router();

noticeRouter.post('/', catchAsync(noticeController.createNotice));
noticeRouter.get('/', catchAsync(noticeController.getNoticeList));
noticeRouter.get('/:noticeId', catchAsync(noticeController.getNoticeDetail));
noticeRouter.patch('/:noticeId', catchAsync(noticeController.updateNotice));
noticeRouter.delete('/:noticeId', catchAsync(noticeController.deleteNotice));

export default noticeRouter;