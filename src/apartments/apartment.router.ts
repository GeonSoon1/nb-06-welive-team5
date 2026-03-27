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
 * 아파트 목록 조회( super_admin, admin, user 다 여기로 와서 controller에서 분기 처리하기)
 */ 
apartmentRouter.get(
  '/',
  authenticate, // 로그인 여부만 확인
  catchAsync(apartmentController.getApartmentsByRole) // 통합 컨트롤러 호출
);


/**
 * [통합 상세 조회] GET /api/apartments/:id
 */
apartmentRouter.get(
  '/:id',
  authenticate, // 유저 식별을 위해 필요
  catchAsync(apartmentController.getApartmentDetailByRole) // 통합 컨트롤러 연결
);


export default apartmentRouter;