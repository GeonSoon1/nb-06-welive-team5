import { catchAsync } from '../libs/catchAsync';
import { EXPRESS } from '../libs/constants';
import * as residentController from './resident.controller';
import { authenticate } from '../middlewares/authenticate';
//import { authorize } from '../middlewares/authorize';
import multer from 'multer';

const residentRouter = EXPRESS.Router();
const upload = multer({ storage: multer.memoryStorage() });

residentRouter.use(authenticate);

residentRouter.get(
  '/file/template',
  //authorize('ADMIN', 'SUPER_ADMIN'),
  catchAsync(residentController.getTemplate),
);
residentRouter.get(
  '/file',
  //authorize('ADMIN', 'SUPER_ADMIN'),
  catchAsync(residentController.exportCsv),
);

residentRouter.post(
  '/from-file',
  upload.single('file'),
  //authorize('ADMIN', 'SUPER_ADMIN'),
  catchAsync(residentController.uploadCsv),
);
residentRouter.post(
  '/from-users/:userId',
  //authorize('ADMIN', 'SUPER_ADMIN'),
  catchAsync(residentController.createResidentFromUser),
);

residentRouter.get(
  '/',
  //authorize('ADMIN', 'SUPER_ADMIN'),
  catchAsync(residentController.getResidents),
);
residentRouter.post(
  '/',
  //authorize('ADMIN', 'SUPER_ADMIN'),
  catchAsync(residentController.createResident),
);

residentRouter.get(
  '/:residentId',
  //authorize('ADMIN', 'SUPER_ADMIN'),
  catchAsync(residentController.getResidentDetail),
);
residentRouter.patch(
  '/:residentId',
  //authorize('ADMIN', 'SUPER_ADMIN'),
  catchAsync(residentController.updateResident),
);
residentRouter.delete(
  '/:residentId',
  //authorize('ADMIN', 'SUPER_ADMIN'),
  catchAsync(residentController.deleteResident),
);

export default residentRouter;
