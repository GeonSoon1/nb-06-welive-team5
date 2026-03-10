import express from 'express';
import * as apartmentController from './apartment.controller';
import { catchAsync } from '../libs/catchAsync';

const apartmentRouter = express.Router();

/**
 * 유저 회원가입 시 아파트 ID를 받아 해당 단지의 동/호수 목록을 조회.
 * 공개된 정보이므로 별도의 권한 체크(authenticate) 없이 접근 가능하도록 설계.
 * {apartmentId}
 */
apartmentRouter.get('/:id/units-for-signup', catchAsync(apartmentController.getApartmentUnitsForSignup))

export default apartmentRouter;