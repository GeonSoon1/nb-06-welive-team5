import * as dotenv from 'dotenv';
import { PrismaClient, Prisma } from '@prisma/client';
import express, { RequestHandler, Request, Response, NextFunction } from 'express';
import * as superstruct from 'superstruct';
import isUuid from 'is-uuid';


dotenv.config();

export const EXPRESS = express;
export const PORT = process.env.PORT || 3000;
export const prismaClient = new PrismaClient;
export { Prisma };
export type ExpressHandler = RequestHandler;
export type ExpressRequest = Request;
export type ExpressResponse = Response;
export type ExpressNextFunction = NextFunction;

export const assert: typeof superstruct.assert = superstruct.assert;
export { superstruct };
export { isUuid };