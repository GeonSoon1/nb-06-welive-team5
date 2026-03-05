import { Role, JoinStatus } from '@prisma/client'
import * as authRepository from './auth.repository';
import { verifyPassword } from '../libs/auth/password';
import { verifyRefreshToken, generateTokens } from '../libs/auth/token';
import UnauthorizedError from '../libs/errors/UnauthorizedError';

export type LoginResponse = {
  id: string;
  name: string;
  email: string;
  role: Role;
  joinStatus: JoinStatus;
  isActive: boolean;
  username: string;
  contact: string;
  avatar: string | null;
  apartmentId: string | null;
  apartmentName: string | null;
  residentDong: string | null;
  boardIds: {
    COMPLAINT?: string;
    NOTICE?: string;
    POLL?: string;
  } | null;
}

export type LoginInput = {
  username: string;
  password: string;
}

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
}

export async function login(input: LoginInput): Promise<{user: LoginResponse; tokens: AuthTokens}> {
  // 1. 유저 조회
  const user = await authRepository.findUserForAuth(input.username);
  if (!user) throw new UnauthorizedError("아이디 또는 비밀번호가 일치하지 않습니다.");

  // 2. 비밀번호 검증
  const isValid = await verifyPassword(input.password, user.password);
  if (!isValid) throw new UnauthorizedError("아이디 또는 비밀번호가 일치하지 않습니다.");

  // 3. 토큰 생성
  const tokens: AuthTokens = generateTokens({
    id: user.id,
    role: user.role,
    apartmentId: user.apartmentId
  });

  // 4. 명세서 규격에 맞춘 boardIds 가공 (스키마 구조 반영)
  const board = user.apartment?.apartmentboard; // findUserForAuth를 통해 가져온 데이터
  const boardIds: Record<string, string> = {};
  
  if (board) {
    if (board.complaints?.[0]) boardIds['COMPLAINT'] = board.complaints[0].id;
    if (board.notices?.[0]) boardIds['NOTICE'] = board.notices[0].id;
    if (board.votes?.[0]) boardIds['POLL'] = board.votes[0].id;
  }

  // 5. 응답 데이터 조립
  const userResponse: LoginResponse = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    joinStatus: user.joinStatus,
    isActive: true,
    username: user.username,
    contact: user.contact,
    avatar: user.image || null,
    apartmentId: user.apartmentId || null,
    apartmentName: user.apartment?.name || null,
    residentDong: user.dong || null,
    boardIds: Object.keys(boardIds).length>0 ? boardIds : null,
  };

  return { user: userResponse, tokens} 
}

export async function refresh(refreshToken: string): Promise<AuthTokens> {
  // [Design Intent]
  // 1. 토큰 자체의 유효성(서명, 만료시간)을 검증한다.
  const decoded = verifyRefreshToken(refreshToken);

  // 2. [Security Check] 토큰은 유효해도 그 사이 유저가 삭제되었거나 정지되었을 수 있다.
  // DB를 조회하여 최신 상태를 확인하는 것이 'Stateful'한 검증의 핵심이다.
  const user = await authRepository.findUserById(decoded.id);
  if (!user) {
    throw new UnauthorizedError("유효하지 않은 사용자입니다.");
  }

  // 3. 모든 검증이 끝나면 새로운 토큰 쌍(Access, Refresh)을 생성한다.
  // Refresh Token Rotation 전략을 사용하여 보안성을 높인다.
  const tokens = generateTokens({
    id: user.id,
    role: user.role,
    apartmentId: user.apartmentId,
  });

  return tokens;
}