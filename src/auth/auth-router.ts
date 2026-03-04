import express from 'express';
import * as authController from './auth-controller';
import { catchAsync } from '../libs/catchAsync';
import { authenticate } from '../middlewares/authenticate'

const authRouter = express.Router();

authRouter.post('/signup', catchAsync(authController.signupUser));
authRouter.post('/signup/super-admin', catchAsync(authController.signupSuperAdmin));
authRouter.post('/signup/admin', catchAsync(authController.signupAdmin));

authRouter.post('/login', catchAsync(authController.login));
authRouter.post('/logout', catchAsync(authController.logout));
authRouter.post('/refresh', catchAsync(authController.refresh));

export default authRouter;
