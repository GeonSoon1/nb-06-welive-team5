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

describe('Complaint API 통합 테스트 (Supertest)', () => {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/complaints (민원 등록)', () => {
    it('유효한 데이터를 보내면 201 상태코드와 성공 메시지를 반환해야 한다.', async () => {
      (authenticate as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = {
          id: 'user-1',
          apartmentId: 'apt-1234',
          role: 'USER',
          joinStatus: 'APPROVED',
        };
        next();
      });

      (complaintService.createComplaint as jest.Mock).mockResolvedValue({
        id: 'comp-1',
      });

      const response = await request(app).post('/api/complaints').send({
        title: '202호 안 내쫓으면 제가 직접 손보겠습니다.',
        content: '층간소음 너무 심해요',
        isPublic: true,
      });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('정상적으로 등록 처리되었습니다');
    });

    it('필수 데이터(title 등)가 누락되면 struct 검증에 걸려 400 상태코드를 반환해야 한다.', async () => {
      (authenticate as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = {
          id: 'user-1',
          apartmentId: 'apt-1234',
          role: 'USER',
          joinStatus: 'APPROVED',
        };
        next();
      });

      const response = await request(app).post('/api/complaints').send({
        content: '내용만 보냅니다.',
        isPublic: true,
      });

      expect(response.status).toBe(400);
    });

    it('가입 승인 대기 중(PENDING)인 유저는 민원을 등록할 수 없으며 403 에러를 반환해야 한다.', async () => {
      (authenticate as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = {
          id: 'user-pending',
          apartmentId: 'apt-1234',
          role: 'USER',
          joinStatus: 'PENDING',
        };
        next();
      });

      const response = await request(app).post('/api/complaints').send({
        title: '미승인 유저의 민원',
        content: '등록되지 않아야 합니다.',
        isPublic: true,
      });

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/complaints (전체 민원 조회 API)', () => {
    it('쿼리 파라미터와 함께 요청하면 200 상태코드와 명세서에 맞는 포맷을 반환해야 한다.', async () => {
      (authenticate as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = {
          id: 'user-1',
          apartmentId: 'apt-1234',
          role: 'USER',
          joinStatus: 'APPROVED',
        };
        next();
      });

      const mockFormattedData = {
        complaints: [
          {
            complaintId: 'comp-1',
            userId: 'user-1',
            title: '204호 담배냄새 더이상 못 참겠습니다.',
            writerName: '김세대',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isPublic: true,
            viewsCount: 26,
            commentsCount: 3,
            status: 'PENDING',
            dong: '204',
            ho: '1002',
          },
        ],
        totalCount: 25,
      };
      (complaintService.getComplaints as jest.Mock).mockResolvedValue(mockFormattedData);

      const response = await request(app).get('/api/complaints?page=1&limit=20&status=PENDING');

      expect(response.status).toBe(200);
      expect(response.body.totalCount).toBe(25);
      expect(response.body.complaints[0].complaintId).toBe('comp-1');
      expect(response.body.complaints[0].title).toBe('204호 담배냄새 더이상 못 참겠습니다.');
    });

    it('인증 정보(아파트 ID 등)가 없으면 401 상태코드를 반환해야 한다.', async () => {
      (authenticate as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = {
          id: 'user-1',
          apartmentId: null,
          role: 'USER',
          joinStatus: 'APPROVED',
        };
        next();
      });

      const response = await request(app).get('/api/complaints');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/complaints/:complaintId (민원 상세 조회 API)', () => {
    it('권한이 있는 유저가 요청하면 200 상태코드와 상세 정보(content 등)를 반환해야 한다.', async () => {
      (authenticate as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = {
          id: 'user-1',
          apartmentId: 'apt-1234',
          role: 'USER',
          joinStatus: 'APPROVED',
        };
        next();
      });

      const mockDetailData = {
        complaintId: 'comp-uuid',
        userId: 'user-1',
        title: '204호 담배냄새 더이상 못 참겠습니다.',
        content: '204호에서 담배 냄새와 소음이 너무 심합니다.',
        writerName: '김세대',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPublic: true,
        viewsCount: 26,
        commentsCount: 3,
        status: 'PENDING',
        dong: '204',
        ho: '1002',
        boardType: '민원',
        comments: [],
      };
      (complaintService.getComplaintDetail as jest.Mock).mockResolvedValue(mockDetailData);

      const response = await request(app).get('/api/complaints/comp-uuid');

      expect(response.status).toBe(200);
      expect(response.body.content).toBe('204호에서 담배 냄새와 소음이 너무 심합니다.');
      expect(response.body.boardType).toBe('민원');
    });

    it('조회 권한이 없는 비공개 민원을 요청하면 403 상태코드를 반환해야 한다.', async () => {
      (authenticate as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = {
          id: 'user-viewer',
          apartmentId: 'apt-1234',
          role: 'USER',
          joinStatus: 'APPROVED',
        };
        next();
      });

      const ForbiddenError = require('../libs/errors/ForbiddenError').default;
      (complaintService.getComplaintDetail as jest.Mock).mockRejectedValue(
        new ForbiddenError('비공개 민원은 작성자와 관리자만 볼 수 있습니다.'),
      );

      const response = await request(app).get('/api/complaints/secret-comp-uuid');

      expect(response.status).toBe(403);
    });
  });

  describe('PATCH /api/complaints/:complaintId (일반 유저 민원 수정 API)', () => {
    it('자신이 작성한 대기중(PENDING)인 민원을 올바른 데이터로 수정하면 200 상태코드와 수정된 정보를 반환해야 한다.', async () => {
      (authenticate as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = {
          id: 'user-author',
          apartmentId: 'apt-1234',
          role: 'USER',
          joinStatus: 'APPROVED',
        };
        next();
      });

      const mockUpdatedData = {
        complaintId: 'comp-1',
        userId: 'user-author',
        title: '엘리베이터 고장 신고(수정)',
        writerName: '김세대',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPublic: true,
        viewsCount: 26,
        commentsCount: 3,
        status: 'PENDING',
        dong: '204',
        ho: '1002',
      };
      (complaintService.updateUserComplaint as jest.Mock).mockResolvedValue(mockUpdatedData);

      const response = await request(app).patch('/api/complaints/comp-1').send({
        title: '엘리베이터 고장 신고(수정)',
        content: '2층 엘리베이터가 작동하지 않습니다. 확인 부탁드립니다.',
        isPublic: true,
      });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('엘리베이터 고장 신고(수정)');
      expect(response.body.complaintId).toBe('comp-1');
    });

    it('수정할 내용(DTO)의 형식이 잘못되면 struct 검증에 걸려 400 에러를 반환해야 한다.', async () => {
      (authenticate as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = {
          id: 'user-author',
          apartmentId: 'apt-1234',
          role: 'USER',
          joinStatus: 'APPROVED',
        };
        next();
      });

      const response = await request(app).patch('/api/complaints/comp-1').send({ title: '' });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/complaints/:complaintId (일반 유저 민원 삭제 API)', () => {
    it('자신이 작성한 대기중인 민원 삭제를 요청하면 200 상태코드와 성공 메시지를 반환해야 한다.', async () => {
      (authenticate as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = {
          id: 'user-author',
          apartmentId: 'apt-1234',
          role: 'USER',
          joinStatus: 'APPROVED',
        };
        next();
      });

      (complaintService.deleteUserComplaint as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app).delete('/api/complaints/comp-1');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('정상적으로 삭제 처리되었습니다');
    });

    it('권한이 없는 유저가 삭제를 시도하면 403 상태코드를 반환해야 한다.', async () => {
      (authenticate as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = {
          id: 'user-other',
          apartmentId: 'apt-1234',
          role: 'USER',
          joinStatus: 'APPROVED',
        };
        next();
      });

      const ForbiddenError = require('../libs/errors/ForbiddenError').default;
      (complaintService.deleteUserComplaint as jest.Mock).mockRejectedValue(
        new ForbiddenError('자신이 작성한 민원만 접근할 수 있습니다.'),
      );

      const response = await request(app).delete('/api/complaints/comp-1');

      expect(response.status).toBe(403);
    });
  });

  describe('PATCH /api/complaints/:complaintId/status (관리자 민원 상태 수정 API)', () => {
    it('관리자가 올바른 상태값으로 변경을 요청하면 200 상태코드와 변경된 상세 정보를 반환해야 한다.', async () => {
      (authenticate as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = {
          id: 'admin-1',
          apartmentId: 'apt-1234',
          role: 'ADMIN',
          joinStatus: 'APPROVED',
        };
        next();
      });

      const mockUpdatedData = {
        complaintId: 'comp-1',
        userId: 'user-author',
        title: '204호 담배냄새 더이상 못 참겠습니다.',
        content: '204호에서 담배 냄새와 소음이 너무 심합니다.',
        writerName: '김세대',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPublic: true,
        viewsCount: 26,
        commentsCount: 3,
        status: 'RESOLVED',
        dong: '204',
        ho: '1002',
        boardType: '민원',
        comments: [],
      };
      (complaintService.updateComplaintStatus as jest.Mock).mockResolvedValue(mockUpdatedData);

      const response = await request(app)
        .patch('/api/complaints/comp-1/status')
        .send({ status: 'RESOLVED' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('RESOLVED');
      expect(response.body.complaintId).toBe('comp-1');
    });

    it('일반 유저(USER)가 상태 변경을 시도하면 403 상태코드를 반환해야 한다.', async () => {
      (authenticate as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = {
          id: 'user-1',
          apartmentId: 'apt-1234',
          role: 'USER',
          joinStatus: 'APPROVED',
        };
        next();
      });

      const ForbiddenError = require('../libs/errors/ForbiddenError').default;
      (complaintService.updateComplaintStatus as jest.Mock).mockRejectedValue(
        new ForbiddenError('관리자만 민원 상태를 변경할 수 있습니다.'),
      );

      const response = await request(app)
        .patch('/api/complaints/comp-1/status')
        .send({ status: 'RESOLVED' });

      expect(response.status).toBe(403);
    });
  });
});
