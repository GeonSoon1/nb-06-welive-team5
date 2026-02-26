import { EXPRESS } from '../libs/constants.js';
import { pollController } from './pollcontroller.js';
import { catchAsync } from '../libs/catchAsync.js';
const pollRouter = EXPRESS.Router();

pollRouter.post('/', catchAsync(pollController.CreatePolls));


export default pollRouter;