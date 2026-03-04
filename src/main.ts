import 'dotenv/config';
import { PORT, EXPRESS } from './libs/constants';
import cors from 'cors';
import { createServer } from 'http';
import { getCorsOrigin } from './libs/corsSetup';
import { routerManager } from './routerManger';
import { globalErrorHandler } from './libs/errors/errorHandler';
import cookieParser from 'cookie-parser';

const app = EXPRESS();
const httpServer = createServer(app);

// 1. 기본 미들웨어 설정 (CORS, Body Parser 등은 라우터보다 먼저 선언해야 함)
app.use(cors({
    origin: getCorsOrigin(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(EXPRESS.static('public'));
app.use(EXPRESS.json());
app.use(EXPRESS.urlencoded({ extended: true }));
app.use(cookieParser())

// 2. 라우터 등록 (catchAsync 제거)
app.use('/api', routerManager);

// 3. 전역 에러 핸들러 등록 (모든 라우터 뒤에 위치)
app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`)
})