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
import complaintRouter from './complaint.router';
import * as complaintService from './complaint.services';
import { authenticate } from '../middlewares/authenticate';
import { globalErrorHandler } from '../libs/errors/errorHandler';
import { Role } from '@prisma/client';

const app = express();
app.use(express.json());

jest.mock('../middlewares/authenticate', () => ({
  authenticate: jest.fn((req, res, next) => {
    req.user = {
      id: 'user-1',
      apartmentId: 'apt-1234',
      role: 'USER',
      joinStatus: 'APPROVED',
    };
    next();
  }),
}));

app.use('/api/complaints', complaintRouter);
app.use(globalErrorHandler);

jest.mock('./complaint.services');

describe('Complaint API 통합 테스트 (리팩토링 버전)', () => {
  const mockAptId = 'apt-1234';
  const mockUserId = 'user-1';

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

  describe('POST /api/complaints (민원 등록)', () => {
    it('성공 시 201과 메시지를 반환하며 서비스에 apartmentId를 전달해야 한다.', async () => {
      setupAuth();
      (complaintService.createComplaint as jest.Mock).mockResolvedValue({ id: 'comp-1' });

      const response = await request(app).post('/api/complaints').send({
        title: '층간소음 테스트',
        content: '테스트 내용입니다.',
        isPublic: true,
      });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('정상적으로 등록 처리되었습니다');
      expect(complaintService.createComplaint).toHaveBeenCalledWith(
        mockUserId,
        mockAptId,
        expect.any(Object),
      );
    });

    it('가입 승인 대기 중(PENDING)인 유저는 403 에러를 반환해야 한다.', async () => {
      setupAuth({ joinStatus: 'PENDING' });

      const response = await request(app).post('/api/complaints').send({
        title: '미승인 유저',
        content: '불가',
        isPublic: true,
      });

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/complaints (전체 목록 조회)', () => {
    it('성공 시 200과 목록을 반환해야 한다.', async () => {
      setupAuth();
      (complaintService.getComplaints as jest.Mock).mockResolvedValue({
        complaints: [],
        totalCount: 0,
      });

      const response = await request(app).get('/api/complaints?page=1&limit=20');

      expect(response.status).toBe(200);
      expect(complaintService.getComplaints).toHaveBeenCalledWith(
        mockAptId,
        mockUserId,
        Role.USER,
        expect.any(Object),
      );
    });

    it('apartmentId가 없으면 401을 반환해야 한다.', async () => {
      setupAuth({ apartmentId: null });

      const response = await request(app).get('/api/complaints');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/complaints/:complaintId (상세 조회)', () => {
    it('성공 시 200을 반환하며 서비스에 4개의 인자를 전달해야 한다.', async () => {
      setupAuth();
      (complaintService.getComplaintDetail as jest.Mock).mockResolvedValue({
        complaintId: 'comp-1',
      });

      const response = await request(app).get('/api/complaints/comp-1');

      expect(response.status).toBe(200);
      expect(complaintService.getComplaintDetail).toHaveBeenCalledWith(
        'comp-1',
        mockUserId,
        Role.USER,
        mockAptId,
      );
    });
  });

  describe('PATCH /api/complaints/:complaintId (수정)', () => {
    it('작성자가 수정 시 200을 반환하며 apartmentId를 검증 인자로 넘겨야 한다.', async () => {
      setupAuth();
      (complaintService.updateUserComplaint as jest.Mock).mockResolvedValue({
        complaintId: 'comp-1',
      });

      const response = await request(app)
        .patch('/api/complaints/comp-1')
        .send({ title: '수정제목', isPublic: false });

      expect(response.status).toBe(200);
      expect(complaintService.updateUserComplaint).toHaveBeenCalledWith(
        'comp-1',
        mockUserId,
        mockAptId,
        expect.any(Object),
      );
    });
  });

  describe('DELETE /api/complaints/:complaintId (삭제)', () => {
    it('삭제 성공 시 명세서 문구와 함께 200을 반환해야 한다.', async () => {
      setupAuth();
      (complaintService.deleteUserComplaint as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app).delete('/api/complaints/comp-1');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('정상적으로 삭제 처리되었습니다');
      expect(complaintService.deleteUserComplaint).toHaveBeenCalledWith(
        'comp-1',
        mockUserId,
        mockAptId,
      );
    });
  });

  describe('PATCH /api/complaints/:complaintId/status (관리자 상태 변경)', () => {
    it('관리자가 아닌 유저가 접근 시 403을 반환해야 한다.', async () => {
      setupAuth({ role: Role.USER });

      const response = await request(app)
        .patch('/api/complaints/comp-1/status')
        .send({ status: 'RESOLVED' });

      expect(response.status).toBe(403);
    });

    it('관리자가 요청 시 200을 반환해야 한다.', async () => {
      setupAuth({ role: Role.ADMIN });
      (complaintService.updateComplaintStatus as jest.Mock).mockResolvedValue({
        status: 'RESOLVED',
      });

      const response = await request(app)
        .patch('/api/complaints/comp-1/status')
        .send({ status: 'RESOLVED' });

      expect(response.status).toBe(200);
    });
  });
});
