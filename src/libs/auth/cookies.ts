// src/libs/auth/cookies.ts
import {
  ExpressResponse,
  REFRESH_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_COOKIE_NAME,
  NODE_ENV,
} from '../../libs/constants';

// NODE_ENV가 'production'이면 isProd에 할당.
const isProd = NODE_ENV === 'production';

// 로그인/토큰 갱신 시 쿠키에 토큰을 넣어주는 과정
export function setTokenCookies(res: ExpressResponse, accessToken: string, refreshToken: string) {
  // 공통 보안 옵션
  const commonOptions = {
    httpOnly: true, // JS에서 접근 불가 (XSS 방어)
    secure: isProd, // 운영 환경(HTTPS)에서만 전송
    sameSite: 'lax' as const, // CSRF 방어와 사용자 편의성 사이의 균형
  };

  // 1. Access Token: 상대적으로 짧은 유효기간 (20시간 - 비즈니스 요구사항 반영)
  res.cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, {
    ...commonOptions,
    maxAge: 20 * 60 * 60 * 1000,
  });

  // 2. Refresh Token: 긴 유효기간 (7일), 특정 경로(/auth/refresh)에서만 전송되도록 제한
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
    ...commonOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/auth/refresh', // 브라우저는 오직 /auth/refresh로 시작하는 경로에 요청을 보낼 때만 이 쿠키를 서버에 같이 보냄.
  });
}

// 로그아웃 시 쿠키를 제거하는 함수
export function clearTokenCookies(res: ExpressResponse) {
  res.clearCookie(ACCESS_TOKEN_COOKIE_NAME);
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
    path: '/api/auth/refresh', // 생성할 때 설정한 path와 일치해야 삭제됨
  });
}
