import request from 'supertest';
import express from 'express';
import apartmentRouter from './apartment.router';
import { globalErrorHandler } from '../libs/errors/errorHandler';
import { ExpressRequest, ExpressResponse, ExpressNextFunction } from '../libs/constants';
import * as apartmentService from './apartment.services';

// 1. Express 앱 설정
const app = express();
app.use(express.json());

// 2. 미들웨어 모킹 (권한 테스트를 위해 유동적으로 설정 가능하게 함)
let mockUser: any = null;

jest.mock('../middlewares/authenticate', () => ({
  authenticate: jest.fn((req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
    if (mockUser) {
      req.user = mockUser;
      next();
    } else {
      res.status(401).json({ message: '인증이 필요합니다.' });
    }
  }),
}));

jest.mock('../middlewares/authorize', () => ({
  authorize: jest.fn(
    () => (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
      next(); // 권한 체크는 통과시키고 서비스 모킹에 집중
    },
  ),
}));

app.use('/api/apartments', apartmentRouter);
app.use(globalErrorHandler);

// 3. 서비스 레이어 모킹
jest.mock('./apartment.services');

describe('Apartment API 통합 테스트', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = null; // 기본은 비로그인 상태
  });

  // --- [공개용 API 테스트] ---
  describe('Public API (누구나 접근 가능)', () => {
    it('GET /api/apartments/public - 성공: 승인된 아파트 목록을 반환한다', async () => {
      const mockResult = {
        apartments: [{ id: 'apt-1', name: '에딘트 아파트', address: '서울' }],
        count: 1,
      };
      (apartmentService.getPublicApartments as jest.Mock).mockResolvedValue(mockResult);

      const res = await request(app).get('/api/apartments/public');

      expect(res.status).toBe(200);
      expect(res.body.apartments).toHaveLength(1);
      expect(res.body.apartments[0]).not.toHaveProperty('adminName'); // 공개 정보엔 관리자 이름 없음
    });

    it('GET /api/apartments/public/:id - 성공: 특정 아파트의 기본 정보를 반환한다', async () => {
      const mockDetail = { id: 'apt-1', name: '에딘트 아파트', structureGroups: [] };
      (apartmentService.getPublicApartmentDetail as jest.Mock).mockResolvedValue(mockDetail);

      const res = await request(app).get('/api/apartments/public/apt-1');

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('에딘트 아파트');
    });
  });

  // --- [관리자 전용 API 테스트] ---
  describe('Admin API (로그인 필요)', () => {
    beforeEach(() => {
      mockUser = { id: 'admin-1', role: 'ADMIN', apartmentId: 'apt-1' }; // 관리자 로그인 상태 주입
    });

    it('GET /api/apartments - 성공: 평탄화된 관리자용 아파트 목록을 반환한다', async () => {
      const mockAdminList = {
        apartments: [
          {
            id: 'apt-1',
            name: '강남 아파트',
            adminName: '김관리',
            adminContact: '010-1234',
          },
        ],
        totalCount: 1,
      };
      (apartmentService.getAdminApartments as jest.Mock).mockResolvedValue(mockAdminList);

      const res = await request(app).get('/api/apartments');

      expect(res.status).toBe(200);
      expect(res.body.apartments[0].adminName).toBe('김관리'); // 평탄화 검증
      expect(res.body.apartments[0]).not.toHaveProperty('admin'); // 중첩 객체 제거 검증
    });

    it('GET /api/apartments/:id - 성공: 상세 정보와 함께 평탄화된 관리자 데이터를 반환한다', async () => {
      const mockDetail = {
        id: 'apt-1',
        name: '강남 아파트',
        adminName: '김관리',
        structureGroups: [],
      };
      (apartmentService.getApartmentDetail as jest.Mock).mockResolvedValue(mockDetail);

      const res = await request(app).get('/api/apartments/apt-1');

      expect(res.status).toBe(200);
      expect(res.body.adminName).toBe('김관리');
    });

    it('GET /api/apartments/:id - 실패: 아파트가 없으면 404를 반환한다', async () => {
      (apartmentService.getApartmentDetail as jest.Mock).mockImplementation(() => {
        throw new Error('존재하지 않는 아파트 입니다.'); // 에러 핸들러가 처리하도록 함
      });

      const res = await request(app).get('/api/apartments/non-exist');
      expect(res.status).toBe(500); // globalErrorHandler 설정에 따라 404 또는 500
    });
  });
});
