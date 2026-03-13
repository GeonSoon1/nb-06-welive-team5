import * as dotenv from 'dotenv';
import { PrismaClient, Prisma } from '@prisma/client';
import express, { RequestHandler, Request, Response, NextFunction } from 'express';
import * as superstruct from 'superstruct';
import isUuid from 'is-uuid';
import NotFoundError from './errors/NotFoundError';


dotenv.config();

export const EXPRESS = express;
export const PORT = process.env.PORT || 3000;
export const prismaClient = new PrismaClient();
export { Prisma };
export type ExpressHandler = RequestHandler;
export type ExpressRequest = Request;
export type ExpressResponse = Response;
export type ExpressNextFunction = NextFunction;

export const assert: typeof superstruct.assert = superstruct.assert;
export { superstruct };
export { isUuid };

export const PUBLIC_PATH = './public';
export const STATIC_PATH = '/public';

// jwt 토큰 (.env 없어도 실행될 수 있기 때문에 .env에 JWT_ACCESS_TOKEN_SECRET 없으면 에러 발생)
const JWT_ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET;
const JWT_REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET;

if (!JWT_ACCESS_TOKEN_SECRET || !JWT_REFRESH_TOKEN_SECRET) {
  throw new NotFoundError('JWT_ACCESS_TOKEN_SECRET 또는 JWT_REFRESH_TOKEN_SECRET이 환경변수에 존재하지 않습니다.');
}

const ACCESS_TOKEN_COOKIE_NAME = "accessToken";
const REFRESH_TOKEN_COOKIE_NAME = "refreshToken";
const NODE_ENV = process.env.NODE_ENV || "development";

export {
  NODE_ENV,
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  JWT_ACCESS_TOKEN_SECRET,
  JWT_REFRESH_TOKEN_SECRET,
};
export { Event as PrismaEvent, Notice, Vote, BoardType, NotificationType } from '@prisma/client';