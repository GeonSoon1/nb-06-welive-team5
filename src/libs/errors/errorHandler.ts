import multer from 'multer';
import { StructError } from 'superstruct';
import { Prisma, ExpressRequest, ExpressResponse, ExpressNextFunction } from './../constants';

// 커스텀 에러 클래스 임포트
import BadRequestError from './BadRequestError';
import ConflictError from './ConflictError';
import ForbiddenError from './ForbiddenError';
import NotFoundError from './NotFoundError';
import UnauthorizedError from './UnauthorizedError';
import ValidationError from './ValidationError';

import { SUPPORT_CONTACT } from '../constants';

/**
 * 모든 커스텀 에러의 기본이 되는 클래스 (커스텀으로 시작해도 괜찮다.)
 */
export class CustomError extends Error {
    public statusCode: number;
    public data: Record<string, unknown> | null;

    constructor(
        statusCode = 500,
        message = '',
        data: Record<string, unknown> | null = null
    ) {
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        this.data = data;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * 404 Not Found 처리 라우터
 */
export function defaultNotFoundHandler(req: ExpressRequest, res: ExpressResponse) {
    return res.status(404).json({
        success: false,
        message: "요청하신 리소스를 찾을 수 없습니다. (Not Found)"
    });
}

/**
 * 통합 Global Error Handler
 */
export const globalErrorHandler = (
    err: any,
    req: ExpressRequest,
    res: ExpressResponse,
    next: ExpressNextFunction
) => {
    // 1. 기본 상태 코드 및 메시지 설정 (CustomError 등에서 전달된 값이 있으면 우선 사용)
    let statusCode = err.statusCode || err.status || 500;
    let message = err.message || '서버 내부 오류가 발생했습니다.';
    let data = err.data || null;

    // 2. Prisma 에러 처리
    if (err instanceof Prisma.PrismaClientInitializationError) {
        statusCode = 500;
        message = '데이터베이스 연결에 실패했습니다. DATABASE_URL을 확인해주세요.';
    } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
            statusCode = 409;
            message = '이미 존재하는 데이터입니다. (중복된 데이터)';
        } else if (err.code === 'P2025') {
            statusCode = 404;
            message = '요청한 데이터를 찾을 수 없습니다.';
        }
    }

    // 3. Multer(파일 업로드) 에러 처리
    else if (err instanceof multer.MulterError) {
        statusCode = 400;
        if (err.code === 'LIMIT_FILE_SIZE') {
            message = '파일 크기가 너무 큽니다.';
        } else if (err.code === 'LIMIT_FILE_COUNT') {
            message = '파일 개수가 너무 많습니다.';
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          message = '허용하지 않은 파일 형식 혹은 요청입니다.'
        } else {
            message = '파일 업로드 중 오류가 발생했습니다.';
        }
    }

    // 4. Superstruct 및 커스텀 HTTP 에러 처리
    else if (err instanceof StructError) {
        statusCode = 400;
        const failure = err.failures()[0];
        
        // 예: ['structureGroups', '0', 'unitsPerFloor'] -> 'unitsPerFloor' 추출
        const path = failure?.path || [];
        const isUnitsPerFloor = path.includes('unitsPerFloor');
        const isMaxFloor = path.includes('maxFloor');
        const isStartFloor = path.includes('startFloor');
        const isDongList = path.includes('dongList');

        // 실제 에러가 발생한 지점의 필드명을 결정 (프론트엔드 전달용)
        const errorField = path[path.length - 1]; 

        if (failure?.refinement === 'MaxTotalUnits') {
            message = `한 번에 생성 가능한 세대수(18,751세대)를 초과했습니다. 관리자(${SUPPORT_CONTACT})에게 문의해 주세요.`;
        } else if (failure?.refinement === 'MaxDongCount' || isDongList) {
            message = '최대 동의 개수는 25개동을 초과할 수 없습니다.'; 
        } else if (isMaxFloor) {
            message = '최대 층수는 30층을 초과할 수 없습니다.'; 
        } else if (isUnitsPerFloor) {
            message = '층당 호수는 최대 25호를 초과할 수 없습니다.'; 
        } else if (isStartFloor) {
            message = '시작 층수는 1층부터 30층 사이여야 합니다.';
        } else {
            message = err.message; 
        }

        
        data = { ...data, field: errorField };
    }
    
    else if (err instanceof BadRequestError) {
        statusCode = 400;
        message = err.message;
    } else if (err instanceof UnauthorizedError) {
        statusCode = 401;
        message = err.message;
    } else if (err instanceof ForbiddenError) {
        statusCode = 403;
        message = err.message;
    } else if (err instanceof NotFoundError) {
        statusCode = 404;
        message = err.message;
    } else if (err instanceof ConflictError) {
        statusCode = 409;
        message = err.message;
    } else if (err instanceof ValidationError) {
        statusCode = 400;
        message = err.message;
    }

    // 5. 서버 콘솔에 에러 기록
    console.error(`[Error] ${statusCode} - ${err.name || 'Unknown'}: ${message}`, err.stack);

    // 6. 클라이언트 응답 전송 (일관된 JSON 포맷)
    return res.status(statusCode).json({
        success: false,
        message,
        ...(data && { data }), // data가 존재할 때만 객체에 포함
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }), // 개발 환경에서만 스택 트레이스 포함
    });
};

export default globalErrorHandler;
