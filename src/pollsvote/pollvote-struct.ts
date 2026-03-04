
import type { ExpressRequest, ExpressResponse, ExpressNextFunction, ExpressHandler } from '../libs/constants';
// Request 타입에 user 속성이 포함된 형태를 정의합니다.
export type RequestWithUser = ExpressRequest & { user?: { userId: string; }; };