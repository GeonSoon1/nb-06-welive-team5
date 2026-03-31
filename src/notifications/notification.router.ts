import { EXPRESS } from '../libs/constants';
import { catchAsync } from '../libs/catchAsync';
import * as notificationController from './notification.controller';
import { authenticate } from '../middlewares/authenticate';
const notificationRouter = EXPRESS.Router();

notificationRouter.get('/sse', authenticate, catchAsync(notificationController.subscribeNotifications));
notificationRouter.patch('/:notificationId/read', authenticate, catchAsync(notificationController.readNotification));

export default notificationRouter;