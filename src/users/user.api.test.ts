import request from 'supertest';
import express from 'express';
import userRouter from './user.router';
import { globalErrorHandler } from '../libs/errors/errorHandler';
import { ExpressRequest, ExpressResponse, ExpressNextFunction } from '../libs/constants';

// 서비스 및 모듈 임포트
import * as userService from './user.services';

const app = express();
app.use(express.json());

/**
 * [MOCK] 인증 미들웨어
 * 로그인된 유저(test-user-id)로 위장한다.
 */
jest.mock('../middlewares/authenticate', () => ({
  authenticate: jest.fn((req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
    req.user = { id: 'test-user-id', role: 'USER' } as any;
    next();
  }),
}));

/**
 * [MOCK] S3 업로드 미들웨어 (multer)
 * 실제로 S3에 올리지 않고, 가짜 파일 정보를 req.file에 넣어준다.
 */
jest.mock('../libs/storage', () => ({
  upload: {
    single: () => (req: any, res: any, next: any) => {
      req.file = {
        location: 'https://s3.amazonaws.com/bucket/profiles/test-image.png'
      };
      next();
    }
  }
}));

app.use('/api/users', userRouter);
app.use(globalErrorHandler);

// 서비스 레이어 모킹
jest.mock('./user.services');

describe('User Profile API 테스트 (user.api.test.ts)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 1. 비밀번호 변경 테스트
  describe('PATCH /api/users/password', () => {
    it('성공: 현재 비밀번호가 일치하면 200을 반환한다', async () => {
      const payload = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!'
      };

      (userService.updatePassword as jest.Mock).mockResolvedValue({ 
        id: 'test-user-id', 
        name: '에딘트' 
      });

      const res = await request(app)
        .patch('/api/users/password')
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('비밀번호가 변경되었습니다');
    });

    it('실패: 새 비밀번호가 정책에 맞지 않으면 400을 반환한다', async () => {
      const res = await request(app)
        .patch('/api/users/password')
        .send({ currentPassword: 'Old!', newPassword: '123' });

      expect(res.status).toBe(400);
    });
  });

  // 2. 프로필 이미지 변경 테스트 (S3 연동)
  describe('PATCH /api/users/me (이미지 업로드)', () => {
    it('성공: 이미지 파일이 업로드되면 200과 성공 메시지를 반환한다', async () => {
      (userService.updateProfileImage as jest.Mock).mockResolvedValue({ 
        name: '에딘트' 
      });

      // supertest의 .attach를 쓰면 멀티파트 요청을 보낼 수 있지만, 
      // 우리는 이미 multer를 모킹했으므로 일반 요청처럼 보내도 결과는 동일하다.
      const res = await request(app)
        .patch('/api/users/me');

      expect(res.status).toBe(200);
      expect(userService.updateProfileImage).toHaveBeenCalledWith(
        'test-user-id', 
        'https://s3.amazonaws.com/bucket/profiles/test-image.png'
      );
    });
  });
});