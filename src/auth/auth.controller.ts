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
  return res.status(201).json(user);
}

export async function signupSuperAdmin(req: ExpressRequest, res: ExpressResponse) {
  const data = s.create(req.body, SignupSuperAdminBodyStruct);
  const rawUser = await superAdminAuthService.signupSuperAdmin(data);

  const user = superAdminAuthService.formatSuperAdminResponse(rawUser);
  return res.status(201).json(user);
}

export async function signupAdmin(req: ExpressRequest, res: ExpressResponse) {
  // 1. 프론트엔드에서 넘어온 평탄화된 데이터 분리
  const {
    startComplexNumber, endComplexNumber,
    startDongNumber, endDongNumber,
    startFloorNumber, endFloorNumber,
    startHoNumber, endHoNumber,
    passwordConfirm, // Struct 검증에 방해되므로 제외(버림)
    ...rest // 나머지 데이터 (username, password, name 등)
  } = req.body;

  // 2. 동 리스트(dongList) 조립 (예: 1단지 1동 ~ 7동 -> "101,102,103,104,105,106,107")
  const dongs: string[] = [];
  const startComplex = parseInt(startComplexNumber, 10) || 1;
  const endComplex = parseInt(endComplexNumber, 10) || 1;
  const startDong = parseInt(startDongNumber, 10) || 1;
  const endDong = parseInt(endDongNumber, 10) || 1;

  for (let c = startComplex; c <= endComplex; c++) {
    for (let d = startDong; d <= endDong; d++) {
      let dongStr = '';
      if (d >= 100) {
        // 이미 프론트에서 101 형태로 보냈다면 그대로 사용
        dongStr = d.toString();
      } else {
        // 단지 + 동 결합 (예: 1 + 01 = 101)
        dongStr = `${c}${String(d).padStart(2, '0')}`;
      }
      dongs.push(dongStr);
    }
  }

  // 3. 층 및 호수 계산
  const startFloor = parseInt(startFloorNumber, 10) || 1;
  const maxFloor = parseInt(endFloorNumber, 10) || 1;

  const startHo = parseInt(startHoNumber, 10) || 1;
  const endHo = parseInt(endHoNumber, 10) || 1;
  // 층당 세대수 (예: 1호부터 12호까지면 12가구)
  const unitsPerFloor = endHo - startHo + 1;

  // 4. 백엔드 스키마(SignupAdminBodyStruct)에 맞게 중첩 객체로 재조립
  const mappedPayload = {
    ...rest,
    structureGroups: [
      {
        dongList: dongs.join(','), // "101,102,103,..." 형태로 변환됨
        startFloor: startFloor,
        maxFloor: maxFloor,
        unitsPerFloor: unitsPerFloor
      }
    ]
  };

  // 5. 조립된 데이터로 Struct 유효성 검사 
  const data = s.create(mappedPayload, SignupAdminBodyStruct);

  // 6. 서비스로 넘겨서 데이터베이스에 저장
  const rawUser = await adminAuthService.signupAdmin(data);
  const user = adminAuthService.formatAdminResponse(rawUser);

  return res.status(201).json(user);
}

export async function login(req: ExpressRequest, res: ExpressResponse) {
  const data = s.create(req.body, LoginBodyStruct);
  const { user, tokens } = await authService.login(data);
  setTokenCookies(res, tokens.access_token, tokens.refresh_token);
  return res.status(200).json(user);
}

export async function logout(req: ExpressRequest, res: ExpressResponse) {
  try {
    // 로그아웃 관련 코드는 try,catch 안써도 된다(오류가 잘 안남)
    clearTokenCookies(res);
    return res.sendStatus(204);
  } catch (err) {
    return res.sendStatus(401);
  }
}

export async function refresh(req: ExpressRequest, res: ExpressResponse) {
  // 브라우저가 /auth/refresh 경로로 자동으로 보내준 쿠키에서 토큰을 추출한다.
  const refresh_token = req.cookies[REFRESH_TOKEN_COOKIE_NAME];

  if (!refresh_token) throw new UnauthorizedError('토큰 갱신 중 오류가 발생했습니다.');

  const tokens = await authService.refresh(refresh_token);

  // 새로운 토큰 세트를 쿠키에 갱신 (기존 쿠키 덮어쓰기)
  setTokenCookies(res, tokens.access_token, tokens.refresh_token);

  return res.status(200).json({ message: '작업이 성공적으로 완료되었습니다' });
}

// app.use(cookieParser())의 역할로 들어오는 쿠키가 밑에처럼 된다.
// req.cookies = {
//   access_token: "abc123",
//   refresh_token: "xyz789"
// }
