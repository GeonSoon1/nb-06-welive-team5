// constants.ts의 필수 환경 변수 검증을 통과하기 위한 가짜 값 설정
process.env.JWT_ACCESS_TOKEN_SECRET = 'test-secret';
process.env.JWT_REFRESH_TOKEN_SECRET = 'test-refresh-secret';
process.env.AWS_REGION = 'ap-northeast-2';
process.env.AWS_ACCESS_KEY_ID = 'test-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
process.env.S3_BUCKET_NAME = 'test-bucket';
process.env.DATABASE_URL = 'postgresql://fake:fake@localhost:5432/fake';

import request from 'supertest';
import express from 'express';
import commentRouter from './comment.router';
import * as commentService from './comment.services';
import { authenticate } from '../middlewares/authenticate';
import { globalErrorHandler } from '../libs/errors/errorHandler';
import { Role, BoardType } from '@prisma/client';

const app = express();
app.use(express.json());

jest.mock('../middlewares/authenticate', () => ({
  authenticate: jest.fn((req, res, next) => {
    req.user = {
      id: 'user-1',
      apartmentId: 'apt-123',
      role: Role.USER,
      joinStatus: 'APPROVED',
    };
    next();
  }),
}));

app.use('/api/comments', commentRouter);
app.use(globalErrorHandler);

jest.mock('./comment.services');

describe('Comment API 통합 테스트', () => {
  const mockUserId = 'user-1';
  const mockAptId = 'apt-123';

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setupAuth = (overrides = {}) => {
    (authenticate as jest.Mock).mockImplementationOnce((req, res, next) => {
      req.user = {
        id: mockUserId,
        apartmentId: mockAptId,
        role: Role.USER,
        joinStatus: 'APPROVED',
        ...overrides,
      };
      next();
    });
  };

  describe('POST /api/comments', () => {
    it('댓글 생성 성공 시 201과 생성된 데이터를 반환해야 한다.', async () => {
      setupAuth();
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      const mockResult = {
        comment: { id: 'c1', userId: mockUserId, content: '내용', writerName: '홍길동' },
        board: { id: validUuid, boardType: 'COMPLAINT' },
      };
      (commentService.createComment as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/comments')
        .send({ content: '내용', boardType: BoardType.COMPLAINT, boardId: validUuid });

      expect(response.status).toBe(201);
      expect(response.body.comment.writerName).toBe('홍길동');
      expect(commentService.createComment).toHaveBeenCalledWith(
        mockUserId,
        mockAptId,
        expect.objectContaining({ content: '내용' }),
      );
    });

    it('필수 데이터가 누락되거나 형식이 잘못되면 400 에러를 반환해야 한다.', async () => {
      setupAuth();
      const response = await request(app)
        .post('/api/comments')
        .send({ content: '', boardType: 'INVALID', boardId: 'not-a-uuid' });

      expect(response.status).toBe(400);
      expect(commentService.createComment).not.toHaveBeenCalled();
    });
  });

  describe('PATCH /api/comments/:commentId', () => {
    it('댓글 수정 성공 시 200을 반환해야 한다.', async () => {
      setupAuth();
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      (commentService.updateComment as jest.Mock).mockResolvedValue({
        comment: { id: 'c1', content: '수정됨' },
        board: { id: validUuid, boardType: 'COMPLAINT' },
      });

      const response = await request(app)
        .patch('/api/comments/c1')
        .send({ content: '수정됨', boardType: BoardType.COMPLAINT, boardId: validUuid });

      expect(response.status).toBe(200);
      expect(commentService.updateComment).toHaveBeenCalled();
    });

    it('필수 데이터(boardId 등)를 누락하고 수정 요청 시 400 에러를 반환해야 한다.', async () => {
      setupAuth();
      const response = await request(app)
        .patch('/api/comments/c1')
        .send({ content: '수정만 보냄' });

      expect(response.status).toBe(400);
      expect(commentService.updateComment).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/comments/:commentId', () => {
    it('삭제 성공 시 명세서의 메시지를 반환해야 한다.', async () => {
      setupAuth();
      (commentService.deleteComment as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app).delete('/api/comments/c1');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('정상적으로 삭제 처리되었습니다');
    });

    it('관리자 권한으로 삭제 시 정상 처리되어야 한다.', async () => {
      setupAuth({ role: Role.ADMIN });
      (commentService.deleteComment as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app).delete('/api/comments/c1');

      expect(response.status).toBe(200);
      expect(commentService.deleteComment).toHaveBeenCalledWith('c1', mockUserId, Role.ADMIN);
    });
  });
});
