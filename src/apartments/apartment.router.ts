import express from 'express';
import { Role } from '@prisma/client';
import * as apartmentController from './apartment.controller';
import { catchAsync } from '../libs/catchAsync';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const apartmentRouter = express.Router();

/**
 * [공개용/회원가입] 아파트 목록 조회
 */
apartmentRouter.get('/public', catchAsync(apartmentController.getPublicApartments));

/**
 * [슈퍼관리자/관리자] 아파트 목록 조회
 */
apartmentRouter.get(
  '/',
  authenticate,
  authorize(Role.SUPER_ADMIN, Role.ADMIN),
  catchAsync(apartmentController.getAdminApartments),
);

/**
 * [공개용/회원가입] 아파트 기본 정보 상세 조회
 */
apartmentRouter.get(
  '/public/:id', 
  catchAsync(apartmentController.getPublicApartmentDetail)
);

/**
 * [슈퍼관리자/관리자] 아파트 상세 조회 
 */
apartmentRouter.get(
  '/:id', 
  authenticate, 
  authorize(Role.SUPER_ADMIN, Role.ADMIN),
  catchAsync(apartmentController.getApartmentDetail)
)

export default apartmentRouter;