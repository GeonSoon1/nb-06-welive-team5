import 'dotenv/config';
import { PORT, EXPRESS } from './libs/constants';
import * as Sentry from '@sentry/node';
import path from 'path';
import cors from 'cors';
import { getCorsOrigin } from './libs/corsSetup';
import { routerManager } from './routerManager';
import { globalErrorHandler, defaultNotFoundHandler } from './libs/errors/errorHandler';
import cookieParser from 'cookie-parser';
import { initScheduler } from './jobs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
});

const app = EXPRESS();

// 로드밸런싱 제대로 작동하는지 확인
app.get('/', (req, res) => {
  const serverName = process.env.SERVER_NAME || 'Unknown';
  console.log(`[Request Log] Handled by: ${serverName}`); // 터미널에 출력
  res.send(`Hello! This response is from ${serverName}`); // 브라우저에 출력
});

// 1. 기본 미들웨어 설정 (CORS, Body Parser 등은 라우터보다 먼저 선언해야 함)
app.use(
  cors({
    origin: getCorsOrigin(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use(cookieParser());
app.use(EXPRESS.json());
app.use(EXPRESS.urlencoded({ extended: true }));

// 2. 라우터 등록 (catchAsync 제거)
app.use('/api', routerManager);

Sentry.setupExpressErrorHandler(app);
// 3. 전역 에러 핸들러 등록 (모든 라우터 뒤에 위치)
app.use(defaultNotFoundHandler);
app.use(globalErrorHandler);

app.listen(PORT, () => {
  initScheduler(); // 서버 시작시 크론도 실
});
