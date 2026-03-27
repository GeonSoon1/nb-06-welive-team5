import express from 'express';
import * as authController from './auth.controller';
import { catchAsync } from '../libs/catchAsync';
import { authorize } from '../middlewares/authorize';
import { authenticate } from '../middlewares/authenticate';
import { Role } from '@prisma/client';
import * as userController from '../users/user.controller';
import * as residentController from '../residents/resident.controller';

const authRouter = express.Router();

authRouter.post('/signup', catchAsync(authController.signupUser));
authRouter.post('/signup/super-admin', authenticate, authorize(Role.SUPER_ADMIN), catchAsync(authController.signupSuperAdmin));
authRouter.post('/signup/admin', catchAsync(authController.signupAdmin));

authRouter.post('/login', catchAsync(authController.login));
authRouter.post('/logout', catchAsync(authController.logout));
authRouter.post('/refresh', catchAsync(authController.refresh));


// [슈퍼관리자] 관리자 가입 상태 일괄 변경
authRouter.patch(
  '/admins/status',
  authenticate,
  authorize(Role.SUPER_ADMIN),
  catchAsync(userController.updateAllAdminStatus),
);

// [슈퍼관리자] 관리자 가입 상태 변경 (단건)
authRouter.patch(
  '/admins/:adminId/status',
  authenticate,
  authorize(Role.SUPER_ADMIN),
  catchAsync(userController.updateAdminStatus)
);

/**
 * [Super-Admin] 관리자 정보(아파트 정보) 수정
 */
authRouter.patch(
  '/admins/:adminId',
  authenticate,
  authorize(Role.SUPER_ADMIN),
  catchAsync(userController.updateAdminInfo)
);

/**
 * [ADMIN] 주민 가입 상태 변경 (단건)
 * 1. authenticate: 로그인 여부 및 토큰 검증
 * 2. authorize(Role.ADMIN): 'APPROVED' 상태인 관리자만 통과
 * { userId }
 */
authRouter.patch(
  '/residents/:residentId/status',
  authenticate,
  authorize(Role.ADMIN),
  catchAsync(residentController.updateResidentStatus)
);

/**
 * [ADMIN] 주민 가입 상태 일괄 변경
 */
authRouter.patch(
  '/residents/status',
  authenticate,
  authorize(Role.ADMIN),
  catchAsync(residentController.updateAllResidentStatus),
);

/**
 * [Super-Admin/ Admin] Rejected된 관리자들 & 유저들 삭제
 */
authRouter.post(
  '/cleanup',
  authenticate,
  authorize(Role.SUPER_ADMIN, Role.ADMIN),
  catchAsync(userController.cleanupRejectedUsers)
);

/**
 * [Super-Admin] 관리자 정보(아파트 정보 포함) 삭제
 */
authRouter.delete(
  '/admins/:adminId',
  authenticate,
  authorize(Role.SUPER_ADMIN),
  catchAsync(userController.deleteAdminAccount)
);

export default authRouter;

