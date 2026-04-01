import { Router } from 'express';
import { upload } from '../libs/storage';
import * as userController from './user.controller';
import { authenticate } from '../middlewares/authenticate';
import { catchAsync } from '../libs/catchAsync';

const userRouter = Router();

// userRouter.patch(
//   '/me', 
//   authenticate, 
//   upload.single('file'), // <- 여기서 S3 업로드가 발생 
//   catchAsync(userController.updateProfileImage));

// userRouter.patch(
//   '/password', 
//   authenticate, 
//   catchAsync(userController.updatePassword));

// userRouter.ts
userRouter.get('/me/avatar', authenticate, userController.getMyProfileImage);

userRouter.patch(
  '/me', 
  authenticate, 
  upload.single('file'), // 파일이 없어도 통과됨 (Multer의 특성)
  catchAsync(userController.updateUserProfile) // 통합 컨트롤러
);

export default userRouter;
