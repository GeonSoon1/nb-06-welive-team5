import { EXPRESS } from '../libs/constants';
import authResidentRouter from './resident/auth-residentrouter';
import authSignupRouter from './signup/auth-signuprouter';
import authAdminRouter from './admin/auth-adminrouter';


const authRouter = EXPRESS.Router();



authRouter.use('/', authResidentRouter);
authRouter.use('/', authSignupRouter);
authRouter.use('/', authAdminRouter);



export default authRouter;