import 'dotenv/config';
export const getCorsOrigin = (): string | string[] => {
    const corsOrigin = process.env.CORS_ORIGIN;

    // credentials: true 일 때 origin: '*' 을 사용하면 브라우저에서 CORS 에러가 발생합니다.
    // 따라서 환경 변수가 없거나 '*'인 경우 로컬 개발 환경의 기본 주소들을 배열로 반환합니다.
    if (!corsOrigin || corsOrigin === '*') {
        return ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5500'
            , 'http://localhost:3001', 'http://localhost:8080'];
    }

    if (corsOrigin.includes(','))
        return corsOrigin.split(',').map((origin) => origin.trim().replace(/\/$/, ''));

    // 단일 origin (trailing slash 제거)
    return corsOrigin.trim().replace(/\/$/, '');
};
