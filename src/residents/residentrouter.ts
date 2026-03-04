import { catchAsync } from '../libs/catchAsync';
import { EXPRESS } from '../libs/constants';
import { ResidentController } from './residentcontroller';
import multer from 'multer';

const residentRouter = EXPRESS.Router();
const residentController = new ResidentController();
const upload = multer({ storage: multer.memoryStorage() }); // 파일을 메모리에 임시 저장

residentRouter.post('/', catchAsync(residentController.createResident));
residentRouter.get('/', catchAsync(residentController.getResidents));
residentRouter.post('/from-users/:userId', catchAsync(residentController.createResidentFromUser));
residentRouter.get('/:residentId', catchAsync(residentController.getResidentDetail));
residentRouter.patch('/:residentId', catchAsync(residentController.updateResident));
residentRouter.delete('/:residentId', catchAsync(residentController.deleteResident));
residentRouter.post('/from-file', upload.single('file'), catchAsync(residentController.uploadCsv));
residentRouter.get('/file/template', catchAsync(residentController.getTemplate));
residentRouter.get('/file', catchAsync(residentController.exportCsv));

export default residentRouter;
