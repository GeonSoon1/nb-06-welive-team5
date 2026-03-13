import { Router } from 'express';
import { upload } from '../libs/storage';
import * as userController from './user.controller';
import { authenticate } from '../middlewares/authenticate';

const userRouter = Router();

userRouter.patch('/me', authenticate, upload.single('file'), userController.updateProfileImage);

export default userRouter;