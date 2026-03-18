import { EXPRESS } from '../libs/constants';
import { catchAsync } from '../libs/catchAsync';
import * as eventController from './event.controller';

const eventRouter = EXPRESS.Router();

eventRouter.get('/', catchAsync(eventController.getEvents));
eventRouter.put('/', catchAsync(eventController.putEvent));
eventRouter.delete('/:eventId', catchAsync(eventController.deleteEvent));

export default eventRouter;