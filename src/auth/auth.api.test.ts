import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import authRouter from './auth.router';
import { globalErrorHandler } from '../libs/errors/errorHandler';
import { ExpressRequest, ExpressResponse, ExpressNextFunction } from '../libs/constants';
import { Role } from '@prisma/client';

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
app.use(cookieParser());

/**
 * [MOCK] 동적 인증 미들웨어
 * mockUser 객체를 수정하여 테스트 케이스마다 권한을 바꿀 수 있게 설계함.
 */
let mockUser: any = {
  id: 'test-admin-id',
  role: Role.SUPER_ADMIN,
  apartmentId: 'apt-123',
};

jest.mock('../middlewares/authenticate', () => ({
  authenticate: jest.fn((req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
    req.user = mockUser;
    next();
  }),
}));

jest.mock('../middlewares/authorize', () => ({
  authorize: jest.fn(() => (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
    next();
  }),
}));

app.use('/api/auth', authRouter);
app.use(globalErrorHandler);

// 모든 의존성 서비스 레이어 Mocking
jest.mock('./auth.service');
jest.mock('./services/user-auth.service');
jest.mock('./services/admin-auth.service');
jest.mock('./services/super-admin-auth.service');
jest.mock('../users/user.services');
jest.mock('../residents/resident.services');

describe('Auth API 종합 테스트 (Full Coverage - 227 Line Version)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 기본 권한은 SUPER_ADMIN으로 리셋
    mockUser = { id: 'test-admin-id', role: Role.SUPER_ADMIN, apartmentId: 'apt-123' };
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

    it('실패: 비밀번호 정책 위반 시 400을 반환한다', async () => {
      const res = await request(app).post('/api/auth/signup').send({ password: '123' });
      expect(res.status).toBe(400);
    });
  });

  // 2. 슈퍼 관리자 회원가입
  describe('POST /api/auth/signup/super-admin', () => {
    it('성공: 슈퍼 관리자 정보를 입력하면 201을 반환한다', async () => {
      const payload = {
        username: 'superadmin',
        password: 'Password123!',
        name: '최고관리자',
        contact: '01011112222',
        email: 'super@test.com',
      };
      (superAdminAuthService.signupSuperAdmin as jest.Mock).mockResolvedValue({ id: 'super-1' });
      (superAdminAuthService.formatSuperAdminResponse as jest.Mock).mockReturnValue({
        id: 'super-1',
        role: Role.SUPER_ADMIN,
      });

      const res = await request(app).post('/api/auth/signup/super-admin').send(payload);

      expect(res.status).toBe(201);
      expect(res.body.role).toBe(Role.SUPER_ADMIN);
    });
  });

  // 3. 관리자 회원가입
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
      (adminAuthService.formatAdminResponse as jest.Mock).mockReturnValue({
        id: 'admin-1',
        role: Role.ADMIN,
      });

      const res = await request(app).post('/api/auth/signup/admin').send(payload);

      expect(res.status).toBe(201);
      expect(res.body.role).toBe(Role.ADMIN);
    });
  });

  // 4. 로그인 및 세션
  describe('Login & Session Management', () => {
    it('POST /api/auth/login - 성공: 쿠키 설정 및 유저 정보 반환', async () => {
      const loginData = { username: 'testuser1', password: 'Password123!' };
      (authService.login as jest.Mock).mockResolvedValue({
        user: { id: 'user-1', name: '홍길동' },
        tokens: { accessToken: 'at', refreshToken: 'rt' },
      });

      const res = await request(app).post('/api/auth/login').send(loginData);

      expect(res.status).toBe(200);
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.body.name).toBe('홍길동');
    });

    it('POST /api/auth/logout - 성공: 204 반환', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).toBe(204);
    });

    it('POST /api/auth/refresh - 성공: 새 토큰 발급', async () => {
      (authService.refresh as jest.Mock).mockResolvedValue({
        accessToken: 'new-at',
        refreshToken: 'new-rt',
      });

      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refreshToken=valid-rt']);

      expect(res.status).toBe(200);
      expect(res.headers['set-cookie']).toBeDefined();
    });
  });

  // 5. 관리자 조작 (Super Admin 전용)
  describe('Super Admin Operations', () => {
    it('PATCH /api/auth/admins/:id/status - 단건 상태 변경', async () => {
      const res = await request(app).patch('/api/auth/admins/admin-1/status').send({ status: 'APPROVED' });
      expect(res.status).toBe(200);
      expect(userService.updateAdminStatus).toHaveBeenCalledWith('admin-1', 'APPROVED');
    });

    it('PATCH /api/auth/admins/status - 일괄 상태 변경', async () => {
      const res = await request(app).patch('/api/auth/admins/status').send({ status: 'APPROVED' });
      expect(res.status).toBe(200);
      expect(userService.updateAllAdminStatus).toHaveBeenCalled();
    });

    it('DELETE /api/auth/admins/:id - 계정 및 아파트 연쇄 삭제', async () => {
      const res = await request(app).delete('/api/auth/admins/admin-1');
      expect(res.status).toBe(200);
      expect(userService.removeAdminAndAssociatedData).toHaveBeenCalledWith('admin-1');
    });
  });

  // 6. 클린업 로직 (핵심 리팩토링 반영)
  describe('Cleanup Operations', () => {
    it('POST /api/auth/cleanup - SUPER_ADMIN 요청 시', async () => {
      mockUser = { id: 'super-1', role: Role.SUPER_ADMIN, apartmentId: null };
      
      const res = await request(app).post('/api/auth/cleanup');

      expect(res.status).toBe(200);
      expect(userService.cleanupRejectedUsers).toHaveBeenCalledWith({
        requestRole: Role.SUPER_ADMIN,
        apartmentId: undefined
      });
    });

    it('POST /api/auth/cleanup - ADMIN 요청 시', async () => {
      mockUser = { id: 'admin-1', role: Role.ADMIN, apartmentId: 'apt-777' };
      
      const res = await request(app).post('/api/auth/cleanup');

      expect(res.status).toBe(200);
      expect(userService.cleanupRejectedUsers).toHaveBeenCalledWith({
        requestRole: Role.ADMIN,
        apartmentId: 'apt-777'
      });
    });
  });

  // 7. 주민 관리 (Admin 전용)
  describe('Resident Operations', () => {
    it('PATCH /api/auth/residents/:id/status - 주민 승인', async () => {
      mockUser = { id: 'admin-1', role: Role.ADMIN, apartmentId: 'apt-123' };
      const res = await request(app).patch('/api/auth/residents/res-1/status').send({ status: 'APPROVED' });
      expect(res.status).toBe(200);
      expect(residentService.updateResidentStatus).toHaveBeenCalled();
    });
  });
});