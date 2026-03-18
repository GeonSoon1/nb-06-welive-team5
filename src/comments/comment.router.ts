import { EXPRESS } from '../libs/constants';
import { catchAsync } from '../libs/catchAsync';
import { authenticate } from '../middlewares/authenticate';
import * as commentController from './comment.controller';
import { Role } from '@prisma/client';
import { authorize } from '../middlewares/authorize';

const commentRouter = EXPRESS.Router();

commentRouter.use(authenticate);
commentRouter.use(authorize(Role.USER, Role.ADMIN, Role.SUPER_ADMIN));

commentRouter.post('/', catchAsync(commentController.createComment));
commentRouter.patch('/:commentId', catchAsync(commentController.updateComment));
commentRouter.delete('/:commentId', catchAsync(commentController.deleteComment));

export default commentRouter;
