import { catchAsync } from '../libs/catchAsync';
import { EXPRESS } from '../libs/constants';
import * as residentController from './resident.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { Role } from '@prisma/client';
import multer from 'multer';

const residentRouter = EXPRESS.Router();
const upload = multer({ storage: multer.memoryStorage() });

residentRouter.use(authenticate);

residentRouter.get(
  '/file/template',
  authorize(Role.ADMIN, Role.SUPER_ADMIN),
  catchAsync(residentController.getTemplate),
);

residentRouter.get(
  '/file',
  authorize(Role.ADMIN, Role.SUPER_ADMIN),
  catchAsync(residentController.exportCsv),
);

residentRouter.post(
  '/from-file',
  upload.single('file'),
  authorize(Role.ADMIN, Role.SUPER_ADMIN),
  catchAsync(residentController.uploadCsv),
);

residentRouter.post(
  '/from-users/:userId',
  authorize(Role.ADMIN, Role.SUPER_ADMIN),
  catchAsync(residentController.createResidentFromUser),
);

residentRouter.get(
  '/',
  authorize(Role.ADMIN, Role.SUPER_ADMIN),
  catchAsync(residentController.getResidents),
);

residentRouter.post(
  '/',
  authorize(Role.ADMIN, Role.SUPER_ADMIN),
  catchAsync(residentController.createResident),
);

residentRouter.get(
  '/:residentId',
  authorize(Role.ADMIN, Role.SUPER_ADMIN),
  catchAsync(residentController.getResidentDetail),
);

residentRouter.patch(
  '/:residentId',
  authorize(Role.ADMIN, Role.SUPER_ADMIN),
  catchAsync(residentController.updateResident),
);

residentRouter.delete(
  '/:residentId',
  authorize(Role.ADMIN, Role.SUPER_ADMIN),
  catchAsync(residentController.deleteResident),
);

export default residentRouter;
