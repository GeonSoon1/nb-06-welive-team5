import { EXPRESS } from '../libs/constants';
import { catchAsync } from '../libs/catchAsync';
import * as notificationController from './notification.controller';

const notificationRouter = EXPRESS.Router();

notificationRouter.get('/sse', notificationController.subscribeNotifications);
notificationRouter.patch('/:notificationId/read', catchAsync(notificationController.readNotification));

export default notificationRouter;