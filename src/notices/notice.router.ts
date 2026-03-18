
import { Role } from '@prisma/client';
import { EXPRESS } from '../libs/constants';
import { catchAsync } from '../libs/catchAsync';
import * as noticeController from './notice.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';


const noticeRouter = EXPRESS.Router();

noticeRouter.post('/', authenticate, authorize(Role.SUPER_ADMIN, Role.ADMIN), catchAsync(noticeController.createNotice));
noticeRouter.get('/', authenticate, catchAsync(noticeController.getNoticeList));
noticeRouter.get('/:noticeId', authenticate, catchAsync(noticeController.getNoticeDetail));
noticeRouter.patch('/:noticeId', authenticate, authorize(Role.SUPER_ADMIN, Role.ADMIN), catchAsync(noticeController.updateNotice));
noticeRouter.delete('/:noticeId', authenticate, authorize(Role.SUPER_ADMIN, Role.ADMIN), catchAsync(noticeController.deleteNotice));

export default noticeRouter;