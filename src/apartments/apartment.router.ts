import express from 'express';
import { Role } from '@prisma/client';
import * as apartmentController from './apartment.controller';
import { catchAsync } from '../libs/catchAsync';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const apartmentRouter = express.Router();

// /**
//  * [공개용/회원가입] 아파트 목록 조회
//  */
// apartmentRouter.get('/public', catchAsync(apartmentController.getPublicApartments));

// /**
//  * [슈퍼관리자/관리자] 아파트 목록 조회
//  */
// apartmentRouter.get(
//   '/',
//   authenticate,
//   authorize(Role.SUPER_ADMIN, Role.ADMIN),
//   catchAsync(apartmentController.getAdminApartments),
// );

/**
 * 아파트 목록 조회( super_admin, admin, user 다 여기로 와서 controller에서 분기 처리하기)
 */ // ()프론트엔드 일치시키기 위해)
apartmentRouter.get(
  '/',
  authenticate, // 로그인 여부만 확인
  catchAsync(apartmentController.getApartmentsByRole) // 통합 컨트롤러 호출
);



// /**
//  * [공개용/회원가입] 아파트 기본 정보 상세 조회
//  */
// apartmentRouter.get(
//   '/public/:id', 
//   catchAsync(apartmentController.getPublicApartmentDetail)
// );

// /**
//  * [슈퍼관리자/관리자] 아파트 상세 조회 
//  */
// apartmentRouter.get(
//   '/:id', 
//   authenticate, 
//   authorize(Role.SUPER_ADMIN, Role.ADMIN),
//   catchAsync(apartmentController.getApartmentDetail)
// )


/**
 * [통합 상세 조회] GET /api/apartments/:id
 * 일반 유저와 관리자가 동일한 엔드포인트를 사용함
 */
apartmentRouter.get(
  '/:id',
  authenticate, // 유저 식별을 위해 필요
  catchAsync(apartmentController.getApartmentDetailByRole) // 통합 컨트롤러 연결
);

export default apartmentRouter;