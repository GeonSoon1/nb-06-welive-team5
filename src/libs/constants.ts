import * as dotenv from 'dotenv';
import { PrismaClient, Prisma } from '@prisma/client';
import express, { RequestHandler, Request, Response, NextFunction } from 'express';
import * as superstruct from 'superstruct';
import isUuid from 'is-uuid';

dotenv.config();

/**
 * 1. 필수 환경 변수 검증 (Fail-Fast)
 * 서버가 기동될 때 가장 먼저 체크해야 할 명단.
 * 기준 : (이 값이 없으면 서버가 아예 동작을 못 하는가?)
 */
const requiredEnv = [
  'JWT_ACCESS_TOKEN_SECRET',
  'JWT_REFRESH_TOKEN_SECRET',
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'S3_BUCKET_NAME',
  'DATABASE_URL'
];

requiredEnv.forEach((name) => {
  if (!process.env[name]) {
    // NotFoundError 대신 일반 Error를 쓰는 이유는 서버 시스템 자체가 굴러가지 못하는 치명적 상황 (지금처럼 일반 Error를 던져서 서버를 시작조차 못 하게 막는 게 최고의 방어.")
    throw new Error(`[Config Error] 환경 변수 '${name}'이(가) .env에 설정되지 않았습니다.`);
  }
});

/**
 * 2. 타입 및 유틸리티 Export
 */
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
/**
 * 3. 설정값
 */
export const NODE_ENV = process.env.NODE_ENV || "development";
export const ACCESS_TOKEN_COOKIE_NAME = "access_token";
export const REFRESH_TOKEN_COOKIE_NAME = "refresh_token";

/**
 * 4. 검증된 환경 변수 Export
 * 위에서 forEach로 걸렀기 때문에 이제 !를 붙여도 100% 안전.
 */
export const JWT_ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET!;
export const JWT_REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET!;

// local(로컬 환경)
// export const AWS_REGION = process.env.AWS_REGION!;
// export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME!;

// export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID!;
// export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY!;


// ec2(서버 환경)
export const AWS_REGION = process.env.AWS_REGION || 'ap-northeast-2';
export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME!;

export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;



export { Event as PrismaEvent, Notice, Vote, BoardType, NotificationType } from '@prisma/client';
/**
 * 5. [Super-Admin/ Admin] Rejected된 관리자들 & 유저들 삭제에 필요한 기간
 */
export const CLEANUP_GRACE_PERIOD_DAYS = 0;

/**
 * 관리자 세대 등록시 최대값 설정
 */
export const SUPPORT_CONTACT = process.env.SUPPORT_CONTACT || "";
export const MAX_BATCH_UNIT_LIMIT = 18751;