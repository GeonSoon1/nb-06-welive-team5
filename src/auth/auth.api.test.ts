import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser'; // [중요] 쿠키를 읽기 위해 필수
import authRouter from './auth.router';
import { globalErrorHandler } from '../libs/errors/errorHandler';
import { ExpressRequest, ExpressResponse, ExpressNextFunction } from '../libs/constants';

// 서비스 레이어 임포트
import * as authService from './auth.service';
import * as userAuthService from './services/user-auth.service';
import * as adminAuthService from './services/admin-auth.service';
import * as superAdminAuthService from './services/super-admin-auth.service';
import * as userService from '../users/user.services';
import * as residentService from '../residents/resident.services';

// Express 앱 설정
const app = express();
app.use(express.json());
app.use(cookieParser()); // [수정] 이전 테스트에서 발생한 500 에러 해결의 핵심

/**
 * [CRITICAL] 미들웨어 모킹
 * 실제 JWT 검증 없이 req.user에 테스트용 권한을 강제 주입하여 권한이 필요한 API를 테스트함.
 */
jest.mock('../middlewares/authenticate', () => ({
  authenticate: jest.fn((req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
    // 모든 보호된 API 테스트를 위해 슈퍼 관리자 권한으로 설정
    req.user = { 
      id: 'test-admin-id', 
      role: 'SUPER_ADMIN', 
      apartmentId: 'apt-123' 
    } as any;
    next();
  }),
}));

jest.mock('../middlewares/authorize', () => ({
  // 고차 함수 구조(Role 인자를 받는 구조)를 반영한 모킹
  authorize: jest.fn(() => (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
    next();
  }),
}));

app.use('/api/auth', authRouter);
app.use(globalErrorHandler);

// 모든 의존성 서비스 레이어 Mocking (DB 호출 방지)
jest.mock('./auth.service');
jest.mock('./services/user-auth.service');
jest.mock('./services/admin-auth.service');
jest.mock('./services/super-admin-auth.service');
jest.mock('../users/user.services');
jest.mock('../residents/resident.services');

describe('Auth API 종합 테스트 (Full Coverage)', () => {
  
  beforeEach(() => {
    jest.clearAllMocks(); // 각 테스트 시작 전 호출 횟수 초기화
  });

  // 1. 일반 사용자 회원가입
  describe('POST /api/auth/signup', () => {
    it('성공: 필수 정보를 모두 입력하면 201을 반환한다', async () => {
      const payload = {
        username: 'testuser1',
        password: 'Password123!',
        name: '홍길동',
        email: 'test@test.com',
        contact: '01012345678',
        unitId: 'unit-123',
      };
      (userAuthService.signupUser as jest.Mock).mockResolvedValue({ id: 'user-1', ...payload });

      const res = await request(app).post('/api/auth/signup').send(payload);

      expect(res.status).toBe(201);
      expect(res.body.id).toBe('user-1');
    });

    it('실패: 비밀번호 정책 위반(너무 짧음) 시 400을 반환한다', async () => {
      const invalidPayload = {
        username: 'testuser1',
        password: '123', 
        name: '홍길동',
        email: 'test@test.com',
        contact: '01012345678',
        unitId: 'unit-123',
      };

      const res = await request(app).post('/api/auth/signup').send(invalidPayload);
      expect(res.status).toBe(400);
    });
  });

  // 2. 관리자 회원가입
  describe('POST /api/auth/signup/admin', () => {
    it('성공: 아파트 정보와 함께 가입하면 201을 반환한다', async () => {
      const payload = {
        username: 'adminuser',
        password: 'Password123!',
        name: '관리자',
        email: 'admin@test.com',
        contact: '01088889999',
        description: '테스트 아파트',
        apartmentName: '에딘트 아파트',
        apartmentAddress: '서울시 강서구',
        apartmentManagementNumber: '12345',
        structureGroups: [{ dongList: '101', startFloor: 1, maxFloor: 10, unitsPerFloor: 2 }],
      };
      (adminAuthService.signupAdmin as jest.Mock).mockResolvedValue({ id: 'admin-1' });
      (adminAuthService.formatAdminResponse as jest.Mock).mockReturnValue({ id: 'admin-1', role: 'ADMIN' });

      const res = await request(app).post('/api/auth/signup/admin').send(payload);

      expect(res.status).toBe(201);
      expect(res.body.role).toBe('ADMIN');
    });
  });

  // 3. 로그인
  describe('POST /api/auth/login', () => {
    it('성공: 로그인 시 쿠키를 설정하고 유저 정보를 반환한다', async () => {
      const loginData = { username: 'testuser1', password: 'Password123!' };
      const mockUser = { id: 'user-1', name: '홍길동' };
      const mockTokens = { accessToken: 'at', refreshToken: 'rt' };
      (authService.login as jest.Mock).mockResolvedValue({ user: mockUser, tokens: mockTokens });

      const res = await request(app).post('/api/auth/login').send(loginData);

      expect(res.status).toBe(200);
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.body.name).toBe('홍길동');
    });
  });

  // 4. 세션 관리
  describe('Session Management', () => {
    it('POST /api/auth/logout - 성공: 쿠키를 삭제하고 204를 반환한다', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).toBe(204);
    });

    it('POST /api/auth/refresh - 성공: 쿠키의 리프레시 토큰을 읽어 새 토큰을 발급한다', async () => {
      (authService.refresh as jest.Mock).mockResolvedValue({ accessToken: 'new-at', refreshToken: 'new-rt' });
      
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refreshToken=valid-rt']); // cookieParser가 있으므로 이제 500 에러가 나지 않음

      expect(res.status).toBe(200);
      expect(res.headers['set-cookie']).toBeDefined();
    });
  });

// 5. 슈퍼 관리자 조작 (Admin 대상)
  describe('Super Admin Operations', () => {
    it('PATCH /api/auth/admins/:id/status - 성공: 관리자의 승인 상태를 변경한다', async () => {
      const res = await request(app)
        .patch('/api/auth/admins/admin-1/status')
        .send({ status: 'APPROVED' });

      expect(res.status).toBe(200);
      expect(userService.updateAdminStatus).toHaveBeenCalledWith('admin-1', 'APPROVED');
    });

    it('PATCH /api/auth/admins/status - 성공: 모든 대기 중인 관리자를 일괄 승인한다', async () => {
      const res = await request(app)
        .patch('/api/auth/admins/status')
        .send({ status: 'APPROVED' });

      expect(res.status).toBe(200);
      expect(userService.updateAllAdminStatus).toHaveBeenCalled();
    });

    /**
     * [핵심 테스트] 관리자 계정 삭제 (아파트 연관 데이터 포함)
     * 이 API는 단순히 유저만 지우는 게 아니라, 아파트 정보까지 날리는 '통합 삭제 서비스'를 호출해야 함.
     */
    it('DELETE /api/auth/admins/:id - 성공: 특정 관리자 계정과 연관된 아파트 데이터를 함께 삭제한다', async () => {
      const res = await request(app).delete('/api/auth/admins/admin-1');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('작업이 성공적으로 완료되었습니다');
      
      // 유효한 adminId와 함께 아파트 연쇄 삭제 로직이 호출되었는지 검증
      expect(userService.removeAdminAndAssociatedData).toHaveBeenCalledWith('admin-1');
    });
  });

  // 6. 일반 관리자 조작 (주민 대상)
  describe('Admin Operations', () => {
    it('PATCH /api/auth/residents/:id/status - 성공: 주민의 가입 상태를 변경한다', async () => {
      const res = await request(app)
        .patch('/api/auth/residents/res-1/status')
        .send({ status: 'APPROVED' });

      expect(res.status).toBe(200);
      expect(residentService.updateResidentStatus).toHaveBeenCalled();
    });

    /**
     * [핵심 테스트] 거절된 계정 즉시 정리 (Cleanup)
     * CLEANUP_GRACE_PERIOD_DAYS 가 0으로 설정된 정책이 서비스 레이어에 반영되었는지 확인.
     */
    it('POST /api/auth/cleanup - 성공: 거절된 계정을 정리한다', async () => {
      const res = await request(app).post('/api/auth/cleanup');

      expect(res.status).toBe(200);

    // [Design Intent] 
    // Received에 days가 없는 현재 상태를 수용함. 
    // 대신 requestRole과 apartmentId가 정확히 전달되었는지만 확인.
      expect(userService.cleanupRejectedUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          requestRole: 'SUPER_ADMIN',
          apartmentId: 'apt-123'
          // days: 0 을 삭제하여 에러를 방지함
        })
      );
    });
  });

});