import {
  ExpressRequest,
  ExpressResponse,
  ExpressNextFunction,
  ACCESS_TOKEN_COOKIE_NAME,
} from '../libs/constants';
import { verifyAccessToken, TokenPayload } from '../libs/auth/token';
import UnauthorizedError from '../libs/errors/UnauthorizedError';

export async function authenticate(
  req: ExpressRequest,
  res: ExpressResponse,
  next: ExpressNextFunction,
) {
  try {
    const token = req.cookies[ACCESS_TOKEN_COOKIE_NAME];

    if (!token) {
      throw new UnauthorizedError('인증 정보가 없습니다. 다시 로그인해주세요.');
    }
    const payload: TokenPayload = verifyAccessToken(token);

    // 3. Request 객체에 유저 정보 주입 (이전에는 req.user가 없었는데 여기서 추가해줌)
    // 이제 컨트롤러에서 req.user.id 로 접근 가능
    // express.d.ts가 정상 작동한다면 req.user = {id: , role: , apartmentId: } 정상 작동 
    req.user = {
      id: payload.id,
      role: payload.role,
      apartmentId: payload.apartmentId ?? null,
    };

    next();
  } catch (err) {
    res.clearCookie(ACCESS_TOKEN_COOKIE_NAME);
    next(err);
  }
}
