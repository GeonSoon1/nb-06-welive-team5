// src/auth/auth.controller.ts
import * as s from 'superstruct';
import { ExpressRequest, ExpressResponse, REFRESH_TOKEN_COOKIE_NAME } from '../libs/constants';
import {
  SignupUserBodyStruct,
  SignupSuperAdminBodyStruct,
  SignupAdminBodyStruct,
  LoginBodyStruct,
} from './auth.struct';

import * as authService from './auth.service';
import * as userAuthService from './services/user-auth.service';
import * as superAdminAuthService from './services/super-admin-auth.service';
import * as adminAuthService from './services/admin-auth.service';

import { clearTokenCookies, setTokenCookies } from '../libs/auth/cookies';
import UnauthorizedError from '../libs/errors/UnauthorizedError';

export async function signupUser(req: ExpressRequest, res: ExpressResponse) {
  const data = s.create(req.body, SignupUserBodyStruct);
  const user = await userAuthService.signupUser(data);
  return res.status(201).json({
    message: '회원가입이 완료되었습니다',
    user,
  });
}

export async function signupSuperAdmin(req: ExpressRequest, res: ExpressResponse) {
  const data = s.create(req.body, SignupSuperAdminBodyStruct);
  const rawUser = await superAdminAuthService.signupSuperAdmin(data);

  const user = superAdminAuthService.formatSuperAdminResponse(rawUser);
  return res.status(201).json({
    message: '회원가입이 완료되었습니다',
    user,
  });
}

export async function signupAdmin(req: ExpressRequest, res: ExpressResponse) {
  const data = s.create(req.body, SignupAdminBodyStruct);
  const rawUser = await adminAuthService.signupAdmin(data);

  const user = adminAuthService.formatAdminResponse(rawUser);

  return res.status(201).json({
    message: '회원가입이 완료되었습니다',
    user,
  });
}

export async function login(req: ExpressRequest, res: ExpressResponse) {
  const data = s.create(req.body, LoginBodyStruct);
  const { user, tokens } = await authService.login(data);
  setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
  return res.status(200).json({
    message: '로그인이 완료되었습니다', //extends (message, success) 만들어서 하나로 돌려쓰기
    user,
  });
}

export async function logout(req: ExpressRequest, res: ExpressResponse) {
  try {
    clearTokenCookies(res);
    return res.status(200).send({ message: '로그아웃이 완료되었습니다' });
  } catch (err) {
    return res.status(401).json({ message: '로그아웃 중 오류가 발생했습니다.' });
  }
}

export async function refresh(req: ExpressRequest, res: ExpressResponse) {
  // 브라우저가 /auth/refresh 경로로 자동으로 보내준 쿠키에서 토큰을 추출한다.
  const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE_NAME];

  if (!refreshToken) {
    throw new UnauthorizedError('토큰 갱신 중 오류가 발생했습니다');
  }

  const tokens = await authService.refresh(refreshToken);

  // 새로운 토큰 세트를 쿠키에 갱신 (기존 쿠키 덮어쓰기)
  setTokenCookies(res, tokens.accessToken, tokens.refreshToken);

  return res.status(200).json({ message: '작업이 성공적으로 완료되었습니다' });
}

// app.use(cookieParser())의 역할로 들어오는 쿠키가 밑에처럼 된다.
// req.cookies = {
//   accessToken: "abc123",
//   refreshToken: "xyz789"
// }
