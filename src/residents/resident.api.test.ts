import request from 'supertest';
import express from 'express';
import residentRouter from './resident.router';
import * as residentService from './resident.services';
import { Readable } from 'stream';
import { authenticate } from '../middlewares/authenticate';
import { globalErrorHandler } from '../libs/errors/errorHandler';

const app = express();
app.use(express.json());

jest.mock('../middlewares/authenticate', () => ({
  authenticate: jest.fn((req, res, next) => {
    req.user = {
      id: 'admin-1',
      apartmentId: 'apt-1234',
      role: 'ADMIN',
      joinStatus: 'APPROVED',
    };
    next();
  }),
}));

app.use('/api/residents', residentRouter);
app.use(globalErrorHandler);

jest.mock('./resident.services');

describe('Resident API 통합 테스트 (Supertest)', () => {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/residents (입주민 목록 조회)', () => {
    it('쿼리 파라미터와 함께 요청하면 200 상태코드와 명세서에 맞는 포맷을 반환해야 한다.', async () => {
      (authenticate as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = {
          id: 'admin-1',
          apartmentId: 'apt-1234',
          role: 'ADMIN',
          joinStatus: 'APPROVED',
        };
        next();
      });

      const mockDbResidents = [
        {
          id: 'res-1',
          dong: '101',
          ho: '101',
          contact: '01012345678',
          name: '김철수',
          residenceStatus: 'RESIDENCE',
          isHouseholder: 'HOUSEHOLDER',
          userId: 'user-123',
          user: {
            id: 'user-123',
            email: 'test@test.com',
            joinStatus: 'APPROVED',
          },
        },
      ];

      (residentService.getResidents as jest.Mock).mockResolvedValue({
        residents: mockDbResidents,
        totalCount: 1,
      });

      const response = await request(app).get('/api/residents?page=1&limit=20&building=101');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('입주민 목록을 성공적으로 불러왔습니다.');
      expect(response.body.count).toBe(1);
      expect(response.body.totalCount).toBe(1);

      const resident = response.body.residents[0];
      expect(resident.id).toBe('res-1');
      expect(resident.building).toBe('101');
      expect(resident.unitNumber).toBe('101');
      expect(resident.userId).toEqual({ id: 'user-123' });
      expect(resident.email).toEqual({ email: 'test@test.com' });
      expect(resident.isRegistered).toBe(true);
      expect(resident.approvalStatus).toBe('APPROVED');
    });

    it('조회 실패 시 400 상태코드를 반환해야 한다.', async () => {
      (authenticate as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = {
          id: 'admin-1',
          apartmentId: 'apt-1234',
          role: 'ADMIN',
          joinStatus: 'APPROVED',
        };
        next();
      });

      const BadRequestError = new Error('목록 조회 실패');
      (residentService.getResidents as jest.Mock).mockRejectedValue(BadRequestError);

      const response = await request(app).get('/api/residents');
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /api/residents (입주민 개별 등록)', () => {
    it('명세서에 맞는 요청을 보내면 201 상태코드와 매핑된 입주민 정보를 반환해야 한다.', async () => {
      (authenticate as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = {
          id: 'admin-1',
          apartmentId: 'apt-1234',
          role: 'ADMIN',
          joinStatus: 'APPROVED',
        };
        next();
      });

      const mockDbResult = {
        id: 'res-new-1',
        dong: '101',
        ho: '101',
        contact: '01059336890',
        name: '홍길동',
        residenceStatus: 'RESIDENCE',
        isHouseholder: 'HOUSEHOLDER',
        userId: 'user-999',
        user: { id: 'user-999', email: 'hong@test.com', joinStatus: 'PENDING' },
      };
      (residentService.createResident as jest.Mock).mockResolvedValue(mockDbResult);

      const response = await request(app).post('/api/residents').send({
        building: '101',
        unitNumber: '101',
        contact: '01059336890',
        name: '홍길동',
        isHouseholder: 'HOUSEHOLDER',
      });

      expect(response.status).toBe(201);
      expect(response.body.id).toBe('res-new-1');
      expect(response.body.building).toBe('101');
      expect(response.body.unitNumber).toBe('101');
      expect(response.body.userId).toEqual({ id: 'user-999' });
      expect(response.body.email).toEqual({ email: 'hong@test.com' });
      expect(response.body.isRegistered).toBe(true);
      expect(response.body.approvalStatus).toBe('PENDING');
    });

    it('필수 데이터가 누락되거나 형식이 틀리면 400 상태코드를 반환해야 한다.', async () => {
      (authenticate as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = {
          id: 'admin-1',
          apartmentId: 'apt-1234',
          role: 'ADMIN',
          joinStatus: 'APPROVED',
        };
        next();
      });

      const response = await request(app).post('/api/residents').send({
        building: '101',
        unitNumber: '101',
        contact: '123',
        isHouseholder: 'HOUSEHOLDER',
      });

      expect(response.status).toBe(400);
    });
  });
  describe('POST /api/residents/from-users/:userId (사용자로부터 입주민 생성 API)', () => {
    it('존재하는 유저 ID를 넘기면 201 상태코드와 매핑된 입주민 정보를 반환해야 한다.', async () => {
      (authenticate as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = {
          id: 'admin-1',
          apartmentId: 'apt-1234',
          role: 'ADMIN',
          joinStatus: 'APPROVED',
        };
        next();
      });

      const mockDbResult = {
        id: 'res-from-user-1',
        dong: '105',
        ho: '202',
        contact: '01011112222',
        name: '김유저',
        residenceStatus: 'RESIDENCE',
        isHouseholder: 'MEMBER',
        userId: 'user-123',
        user: { id: 'user-123', email: 'user@test.com' },
      };
      (residentService.createResidentFromUser as jest.Mock).mockResolvedValue(mockDbResult);

      const response = await request(app).post('/api/residents/from-users/user-123');

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('유저 정보로 입주민 등록이 완료되었습니다.'); //
      expect(response.body.id).toBe('res-from-user-1');
      expect(response.body.userId).toEqual({ id: 'user-123' });
      expect(response.body.building).toBe('105');
      expect(response.body.unitNumber).toBe('202');
      expect(response.body.isHouseholder).toBe('MEMBER');
      expect(response.body.isRegistered).toBe(true);
    });

    it('생성에 실패(유저 없음 등)하면 400 상태코드를 반환해야 한다.', async () => {
      (authenticate as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = {
          id: 'admin-1',
          apartmentId: 'apt-1234',
          role: 'ADMIN',
          joinStatus: 'APPROVED',
        };
        next();
      });

      const BadRequestError = new Error('사용자로부터 입주민 리소스 생성 실패');
      (residentService.createResidentFromUser as jest.Mock).mockRejectedValue(BadRequestError);

      const response = await request(app).post('/api/residents/from-users/invalid-id');

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /api/residents/file/template (템플릿 다운로드 API)', () => {
    it('관리자가 요청하면 200 상태코드와 CSV 형식의 파일을 반환해야 한다.', async () => {
      (authenticate as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = {
          id: 'admin-1',
          apartmentId: 'apt-1234',
          role: 'ADMIN',
          joinStatus: 'APPROVED',
        };
        next();
      });

      const mockStream = Readable.from(['이름,연락처,동,호,세대주여부\n']);
      (residentService.getCsvTemplate as jest.Mock).mockResolvedValue(mockStream);

      const response = await request(app).get('/api/residents/file/template');

      expect(response.status).toBe(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('template.csv');
    });

    it('서비스에서 에러가 발생하면 500(또는 설정된 에러) 상태코드를 반환해야 한다.', async () => {
      (authenticate as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = {
          id: 'admin-1',
          apartmentId: 'apt-1234',
          role: 'ADMIN',
          joinStatus: 'APPROVED',
        };
        next();
      });

      (residentService.getCsvTemplate as jest.Mock).mockRejectedValue(
        new Error('스트림 생성 실패'),
      );

      const response = await request(app).get('/api/residents/file/template');

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /api/residents/from-file (파일로부터 입주민 생성 API)', () => {
    it('CSV 파일을 업로드하면 201 상태코드와 생성된 입주민 수를 반환해야 한다.', async () => {
      (authenticate as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = {
          id: 'admin-1',
          apartmentId: 'apt-1234',
          role: 'ADMIN',
          joinStatus: 'APPROVED',
        };
        next();
      });

      (residentService.uploadResidentsFromCsv as jest.Mock).mockResolvedValue({
        count: 2,
      });

      const mockCsvBuffer = Buffer.from(
        '이름,연락처,동,호,세대주여부\n테스트1,01011112222,101,101,세대주\n테스트2,01033334444,101,102,세대원',
      );
      const response = await request(app)
        .post('/api/residents/from-file')
        .attach('file', mockCsvBuffer, 'test.csv');

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('2명의 입주민이 등록되었습니다');
      expect(response.body.count).toBe(2);
    });

    it('파일 없이 요청하면 400 상태코드를 반환해야 한다.', async () => {
      (authenticate as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = {
          id: 'admin-1',
          apartmentId: 'apt-1234',
          role: 'ADMIN',
          joinStatus: 'APPROVED',
        };
        next();
      });

      const response = await request(app).post('/api/residents/from-file');

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /api/residents/file (입주민 목록 다운로드 API)', () => {
    it('쿼리 파라미터와 함께 요청하면 200 상태코드와 데이터가 담긴 CSV 파일을 반환해야 한다.', async () => {
      (authenticate as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = {
          id: 'admin-1',
          apartmentId: 'apt-1234',
          role: 'ADMIN',
          joinStatus: 'APPROVED',
        };
        next();
      });

      const mockStream = Readable.from([
        '이름,연락처,동,호,세대주여부\n김철수,01012345678,101,101,세대주\n',
      ]);
      (residentService.exportResidentsToCsv as jest.Mock).mockResolvedValue(mockStream);

      const response = await request(app).get('/api/residents/file?building=101');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('residents.csv');
    });

    it('아파트 ID가 없는 유저가 요청하면 401 상태코드를 반환해야 한다.', async () => {
      (authenticate as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = {
          id: 'admin-1',
          apartmentId: null,
          role: 'ADMIN',
          joinStatus: 'APPROVED',
        };
        next();
      });

      const response = await request(app).get('/api/residents/file');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/residents/:residentId (입주민 상세 조회 API)', () => {
    it('존재하는 입주민 ID로 요청하면 200 상태코드와 상세 정보를 반환해야 한다.', async () => {
      (authenticate as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = {
          id: 'admin-1',
          apartmentId: 'apt-1234',
          role: 'ADMIN',
          joinStatus: 'APPROVED',
        };
        next();
      });

      const mockDbResident = {
        id: 'res-1',
        dong: '101',
        ho: '101',
        contact: '01012345678',
        name: '김철수',
        residenceStatus: 'RESIDENCE',
        isHouseholder: 'HOUSEHOLDER',
        userId: 'user-123',
        user: { id: 'user-123', email: 'test@test.com' },
      };
      (residentService.getResidentDetail as jest.Mock).mockResolvedValue(mockDbResident);

      const response = await request(app).get('/api/residents/res-1');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('res-1');
      expect(response.body.building).toBe('101');
      expect(response.body.unitNumber).toBe('101');
      expect(response.body.userId).toEqual({ id: 'user-123' });
      expect(response.body.email).toEqual({ email: 'test@test.com' });
      expect(response.body.isRegistered).toBe(true);
    });

    it('존재하지 않는 입주민 ID로 요청하면 400 상태코드를 반환해야 한다.', async () => {
      (authenticate as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = {
          id: 'admin-1',
          apartmentId: 'apt-1234',
          role: 'ADMIN',
          joinStatus: 'APPROVED',
        };
        next();
      });

      const BadRequestError = new Error('입주민 상세 조회 실패');
      (residentService.getResidentDetail as jest.Mock).mockRejectedValue(BadRequestError);

      const response = await request(app).get('/api/residents/invalid-id');

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('PATCH /api/residents/:residentId (입주민 정보 수정 API)', () => {
    it('올바른 데이터와 함께 요청하면 200 상태코드와 수정된 입주민 정보를 반환해야 한다.', async () => {
      (authenticate as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = {
          id: 'admin-1',
          apartmentId: 'apt-1234',
          role: 'ADMIN',
          joinStatus: 'APPROVED',
        };
        next();
      });

      const mockUpdatedResult = {
        id: 'res-1',
        dong: '101',
        ho: '102',
        contact: '01059336890',
        name: '홍길동(수정)',
        residenceStatus: 'RESIDENCE',
        isHouseholder: 'HOUSEHOLDER',
        userId: 'user-123',
        user: { id: 'user-123', email: 'test@test.com' },
      };
      (residentService.updateResident as jest.Mock).mockResolvedValue(mockUpdatedResult);

      const response = await request(app).patch('/api/residents/res-1').send({
        building: '101',
        unitNumber: '102',
        contact: '01059336890',
        name: '홍길동(수정)',
        isHouseholder: 'HOUSEHOLDER',
      });

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('res-1');
      expect(response.body.name).toBe('홍길동(수정)');
      expect(response.body.building).toBe('101');
      expect(response.body.unitNumber).toBe('102');
      expect(response.body.userId).toEqual({ id: 'user-123' });
    });

    it('잘못된 형식의 데이터를 보내면 400 상태코드를 반환해야 한다.', async () => {
      // [준비] 로그인 통과
      (authenticate as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = {
          id: 'admin-1',
          apartmentId: 'apt-1234',
          role: 'ADMIN',
          joinStatus: 'APPROVED',
        };
        next();
      });

      const response = await request(app).patch('/api/residents/res-1').send({ contact: '123' });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/residents/:residentId (입주민 삭제 API)', () => {
    it('인증된 관리자가 삭제를 요청하면 200 상태코드와 성공 메시지를 반환해야 한다.', async () => {
      (authenticate as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = {
          id: 'admin-1',
          apartmentId: 'apt-1234',
          role: 'ADMIN',
          joinStatus: 'APPROVED',
        };
        next();
      });
      (residentService.deleteResident as jest.Mock).mockResolvedValue(true);

      const response = await request(app).delete('/api/residents/res-1');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('작업이 성공적으로 완료되었습니다');
    });

    it('존재하지 않는 입주민 삭제 시도 시 400 상태코드를 반환해야 한다.', async () => {
      (authenticate as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = {
          id: 'admin-1',
          apartmentId: 'apt-1234',
          role: 'ADMIN',
          joinStatus: 'APPROVED',
        };
        next();
      });

      const BadRequestError = new Error('입주민 정보 삭제 실패');
      (residentService.deleteResident as jest.Mock).mockRejectedValue(BadRequestError);

      const response = await request(app).delete('/api/residents/invalid-id');

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});
