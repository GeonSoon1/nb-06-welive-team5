import jwt from 'jsonwebtoken';
import { JWT_ACCESS_TOKEN_SECRET, JWT_REFRESH_TOKEN_SECRET } from "../constants";
import UnauthorizedError from '../errors/UnauthorizedError';
import { Role } from '@prisma/client';

export type TokenPayload = {
  id: string;
  role: Role;
  apartmentId?: string | null;
};

// 1. Access Token 생성
// constants.ts에서 JWT_ACCESS_TOKEN_SECRET가 있음을 검증을 했으므로 '!'를 붙여서 통과시킴
export function generateTokens(payload: TokenPayload) {
  const accessToken = jwt.sign(payload, JWT_ACCESS_TOKEN_SECRET!, {
    expiresIn: "20h" //5m or 1h
  });
  // 2. Refresh Token 생성 (Payload를 최소화하여 보안 강화)
  const refreshToken = jwt.sign({ id: payload.id }, JWT_REFRESH_TOKEN_SECRET!, {
    expiresIn: "7d" 
  });
  return { accessToken, refreshToken };
}

// 3. Access Token 검증
export function verifyAccessToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_ACCESS_TOKEN_SECRET!);
    
    // 단순 캐스팅 대신 구조 확인
    if (typeof decoded === 'object' && 'id' in decoded && 'role' in decoded) {
      return decoded as TokenPayload;
    }
    throw new UnauthorizedError("토큰 형식이 올바르지 않습니다.");
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError("만료된 토큰입니다.");
    }
    throw new UnauthorizedError("유효하지 않은 토큰입니다.");
  }
}

// 4. Refresh Token 검증
export function verifyRefreshToken(token: string): { id: string } {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_TOKEN_SECRET!);
    if (typeof decoded === 'object' && 'id' in decoded) {
      return decoded as { id: string };
    }
    throw new UnauthorizedError("리프레시 토큰 형식이 올바르지 않습니다.");
  } catch (err) {
    throw new UnauthorizedError("리프레시 토큰이 유효하지 않습니다.");
  }
}