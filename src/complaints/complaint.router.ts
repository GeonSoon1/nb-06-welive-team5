import { EXPRESS } from '../libs/constants';
import { catchAsync } from '../libs/catchAsync';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { Role } from '@prisma/client';
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
  authorize(Role.ADMIN, Role.SUPER_ADMIN),
  catchAsync(complaintController.updateComplaintStatus),
);

export default complaintRouter;
