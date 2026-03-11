import express from 'express';
import { Role } from '@prisma/client';
import * as apartmentController from './apartment.controller';
import { catchAsync } from '../libs/catchAsync';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const apartmentRouter = express.Router();

apartmentRouter.get('/public', catchAsync(apartmentController.getPublicApartments));

apartmentRouter.get(
  '/',
  authenticate,
  authorize(Role.SUPER_ADMIN, Role.ADMIN),
  catchAsync(apartmentController.getAdminApartments),
);




export default apartmentRouter;