import 'dotenv/config';
export const getCorsOrigin = (): string | string[] => {
    const corsOrigin = process.env.CORS_ORIGIN;
    if (!corsOrigin || corsOrigin === '*') return '*';

    if (corsOrigin.includes(','))
        return corsOrigin.split(',').map((origin) => origin.trim().replace(/\/$/, ''));

    // 단일 origin (trailing slash 제거)
    return corsOrigin.trim().replace(/\/$/, '');
};
