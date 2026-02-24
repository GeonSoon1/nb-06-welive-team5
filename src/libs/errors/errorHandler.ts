import { ExpressRequest, ExpressResponse, ExpressNextFunction } from "../constants";
import { StructError } from "superstruct";
import BadRequestError from "./BadRequestError.js";
import ConflictError from "./ConflictError.js";
import ForbiddenError from "./ForbiddenError";
import NotFoundError from "./NotFoundError";
import UnauthorizedError from "./UnauthorizedError";
import { PrismaClient, Prisma } from '@prisma/client';

export function defaultNotFoundHandler(req: ExpressRequest, res: ExpressResponse) {
  return res.status(404).json({ message: "Not Found" });
}

export function globalErrorHandler(err: Error, req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) {
  if (err instanceof StructError || err instanceof BadRequestError) {
    return res.status(400).json({ message: err.message });
  }

  if (err instanceof UnauthorizedError) {
    return res.status(401).json({ message: err.message });
  }

  if (err instanceof ForbiddenError) {
    return res.status(403).json({ message: err.message });
  }

  if (err instanceof NotFoundError) {
    return res.status(404).json({ message: err.message });
  }

  if (err instanceof ConflictError) {
    return res.status(409).json({ message: err.message });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "존재하지 않는 리소스입니다." });
    }
    
    if (err.code === "P2002") {
      return res.status(409).json({ message: "이미 존재하는 데이터입니다." });
    }
  }

  return res
    .status(500)
    .json({ message: err.message || "Internal Server Error" });
}
