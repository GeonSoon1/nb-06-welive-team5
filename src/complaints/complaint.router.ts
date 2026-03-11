import { EXPRESS } from '../libs/constants';
import { catchAsync } from '../libs/catchAsync';
import { authenticate } from '../middlewares/authenticate';
import * as complaintController from './complaint.controller';

const complaintRouter = EXPRESS.Router();

complaintRouter.use(authenticate);

complaintRouter.post('/', catchAsync(complaintController.createComplaint));
complaintRouter.get('/', catchAsync(complaintController.getComplaints));
complaintRouter.get('/:complaintId', catchAsync(complaintController.getComplaintDetail));
complaintRouter.patch('/:complaintId', catchAsync(complaintController.updateUserComplaint));
complaintRouter.delete('/:complaintId', catchAsync(complaintController.deleteUserComplaint));
complaintRouter.patch(
  '/:complaintId/status',
  catchAsync(complaintController.updateComplaintStatus),
);

export default complaintRouter;
