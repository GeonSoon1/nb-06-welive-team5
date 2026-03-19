import 'dotenv/config';
import { PORT, EXPRESS } from './libs/constants';
import path from 'path';
import cors from 'cors';
import { getCorsOrigin } from './libs/corsSetup';
import { routerManager } from './routerManager';
import { globalErrorHandler, defaultNotFoundHandler } from './libs/errors/errorHandler';
import cookieParser from 'cookie-parser';
import { initScheduler } from './jobs';

const app = EXPRESS();

// 1. 기본 미들웨어 설정 (CORS, Body Parser 등은 라우터보다 먼저 선언해야 함)
app.use(cors({
  origin: getCorsOrigin(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(cookieParser())
app.use(EXPRESS.json());
app.use(EXPRESS.urlencoded({ extended: true }));

// 2. 라우터 등록 (catchAsync 제거)
app.use('/api', routerManager);

// 3. 전역 에러 핸들러 등록 (모든 라우터 뒤에 위치)
app.use(defaultNotFoundHandler)
app.use(globalErrorHandler);


app.listen(PORT, () => {
  initScheduler(); // 서버 시작시 크론도 실
  console.log(`Server started on port ${PORT}`);
});