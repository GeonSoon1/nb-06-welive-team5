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
  * [공개용/회원가입] 아파트 기본 정보 상세 조회
  */
apartmentRouter.get(
  '/public/:id',
  catchAsync(apartmentController.getPublicApartmentDetail)
);


/**
 * [통합 목록 조회] GET /api/apartments
 */
apartmentRouter.get(
  '/',
  // authenticate, // 로그인 여부만 확인 <- 회원가입시에는 아무런 인증이 없이 목록 조회가 필요함
  catchAsync(apartmentController.getApartmentsByRole) // 통합 컨트롤러 호출
);


/**
 * [통합 상세 조회] GET /api/apartments/:id
 */
apartmentRouter.get(
  '/:id',
  //authenticate, // 유저 식별을 위해 필요 <- 회원가입시에는 아무런 인증이 없이 목록 조회가 필요함
  catchAsync(apartmentController.getApartmentDetailByRole) // 통합 컨트롤러 연결
);


export default apartmentRouter;