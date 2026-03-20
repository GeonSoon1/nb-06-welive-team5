import { EXPRESS } from '../libs/constants';
import { catchAsync } from '../libs/catchAsync';
import * as eventController from './event.controller';

import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { Role } from '@prisma/client';
const eventRouter = EXPRESS.Router();

eventRouter.get('/', authenticate, catchAsync(eventController.getEvents));
eventRouter.put('/', authenticate, authorize(Role.SUPER_ADMIN, Role.ADMIN), catchAsync(eventController.putEvent));
eventRouter.delete('/:eventId', authenticate, authorize(Role.SUPER_ADMIN, Role.ADMIN), catchAsync(eventController.deleteEvent));

export default eventRouter;