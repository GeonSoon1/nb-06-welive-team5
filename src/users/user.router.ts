import { Router } from 'express';
import { upload } from '../libs/storage';
import * as userController from './user.controller';
import { authenticate } from '../middlewares/authenticate';
import { catchAsync } from '../libs/catchAsync';

const userRouter = Router();

userRouter.patch('/me', authenticate, upload.single('file'), catchAsync(userController.updateProfileImage));
userRouter.patch('/password', authenticate, catchAsync(userController.updatePassword));

export default userRouter;