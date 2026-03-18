// constants.ts의 필수 환경 변수 검증을 통과하기 위한 가짜 값 설정
process.env.JWT_ACCESS_TOKEN_SECRET = 'test-secret';
process.env.JWT_REFRESH_TOKEN_SECRET = 'test-refresh-secret';
process.env.AWS_REGION = 'ap-northeast-2';
process.env.AWS_ACCESS_KEY_ID = 'test-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
process.env.S3_BUCKET_NAME = 'test-bucket';
process.env.DATABASE_URL = 'postgresql://fake:fake@localhost:5432/fake';

import * as complaintService from './complaint.services';
import * as complaintRepository from './complaint.repository';
import BadRequestError from '../libs/errors/BadRequestError';
import ForbiddenError from '../libs/errors/ForbiddenError';
import { GetComplaintsQueryDto } from './complaint.struct';

jest.mock('./complaint.repository');

describe('Complaint Service 유닛 테스트', () => {
  const mockDate = new Date();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createComplaint (민원 등록 서비스)', () => {
    it('authorId, apartmentId와 DTO를 받아 Repository를 호출하고 포맷팅된 민원을 반환해야 한다.', async () => {
      const mockAuthorId = 'user-1';
      const mockApartmentId = 'apt-1234';
      const mockBoardId = 'board-123';
      const mockDto = { title: '민원 제목', content: '민원 내용', isPublic: true };

      const expectedDbResult = {
        id: 'comp-1',
        title: mockDto.title,
        content: mockDto.content,
        isPublic: mockDto.isPublic,
        authorId: mockAuthorId,
        apartmentboardId: mockBoardId,
        viewCount: 0,
        commentsCount: 0,
        status: 'PENDING',
        createdAt: mockDate,
        updatedAt: mockDate,
        author: { name: '작성자', apartmentUnit: { dong: '101', ho: '101' } },
        comments: [],
      };

      (complaintRepository.getBoardIdByApartment as jest.Mock).mockResolvedValue(mockBoardId);
      (complaintRepository.createComplaint as jest.Mock).mockResolvedValue(expectedDbResult);

      const result = await complaintService.createComplaint(mockAuthorId, mockApartmentId, mockDto);

      expect(complaintRepository.getBoardIdByApartment).toHaveBeenCalledWith(mockApartmentId);
      expect(result.complaintId).toBe('comp-1'); // 포맷팅된 Key 확인
      expect(result.dong).toBe('101');
    });

    it('게시판 정보를 찾을 수 없으면 BadRequestError를 던져야 한다.', async () => {
      (complaintRepository.getBoardIdByApartment as jest.Mock).mockResolvedValue(null);

      await expect(
        complaintService.createComplaint('user-1', 'apt-1234', {
          title: '제목',
          content: '내용',
          isPublic: true,
        }),
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('getComplaints (전체 민원 조회 서비스)', () => {
    it('아파트 ID와 쿼리를 받아 Repository를 호출하고 포맷팅된 목록을 반환해야 한다.', async () => {
      const mockApartmentId = 'apt-1234';
      const queryParams: GetComplaintsQueryDto = { page: '1', limit: '20' };

      const mockDbComplaints = [
        {
          id: 'comp-1',
          authorId: 'user-other',
          title: '비공개 민원',
          isPublic: false,
          viewCount: 10,
          commentsCount: 0,
          status: 'PENDING',
          createdAt: mockDate,
          updatedAt: mockDate,
          author: { name: '비밀작성자', apartmentUnit: { dong: '101', ho: '101' } },
        },
      ];

      (complaintRepository.getComplaints as jest.Mock).mockResolvedValue({
        complaints: mockDbComplaints,
        totalCount: 1,
      });

      const result = await complaintService.getComplaints(
        mockApartmentId,
        'user-viewer',
        'USER',
        queryParams,
      );

      const complaint = result.complaints[0]!;
      expect(complaint.title).toBe('🔒 비공개 민원입니다.');
      expect(complaint.writerName).toBe('익명');
    });
  });

  describe('getComplaintDetail (민원 상세 조회 서비스)', () => {
    it('조회 권한이 있는 경우 조회수를 증가시키고 상세 정보(content, comments)를 반환해야 한다.', async () => {
      const mockComplaintId = 'comp-1';
      const mockComplaint = {
        id: mockComplaintId,
        authorId: 'user-other',
        title: '공개 민원',
        content: '본문 내용',
        isPublic: true,
        viewCount: 10,
        commentsCount: 0,
        status: 'PENDING',
        createdAt: mockDate,
        updatedAt: mockDate,
        author: { name: '작성자', apartmentUnit: { dong: '101', ho: '101' } },
        comments: [],
      };

      (complaintRepository.getComplaintDetail as jest.Mock).mockResolvedValue(mockComplaint);
      (complaintRepository.incrementComplaintViewCount as jest.Mock).mockResolvedValue({});

      const result = await complaintService.getComplaintDetail(
        mockComplaintId,
        'user-viewer',
        'ADMIN',
      );

      expect(complaintRepository.incrementComplaintViewCount).toHaveBeenCalledWith(mockComplaintId);
      expect(result.content).toBe('본문 내용');
      expect(result.boardType).toBe('민원');
      expect(result.comments).toBeDefined();
    });

    it('권한이 없는 유저가 비공개 민원을 조회하면 ForbiddenError를 던져야 한다.', async () => {
      (complaintRepository.getComplaintDetail as jest.Mock).mockResolvedValue({
        id: 'secret-1',
        authorId: 'other-user',
        isPublic: false,
      });

      await expect(
        complaintService.getComplaintDetail('secret-1', 'user-viewer', 'USER'),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('updateComplaintStatus (관리자 민원 상태 수정 서비스)', () => {
    it('상태를 변경하고 상세 정보를 포함하여 반환해야 한다.', async () => {
      const mockComplaintId = 'comp-1';
      const mockUpdatedResult = {
        id: mockComplaintId,
        authorId: 'user-author',
        title: '민원 제목',
        content: '민원 내용',
        isPublic: true,
        viewCount: 10,
        commentsCount: 2,
        status: 'RESOLVED',
        createdAt: mockDate,
        updatedAt: mockDate,
        author: { name: '작성자', apartmentUnit: { dong: '101', ho: '101' } },
        comments: [],
      };

      (complaintRepository.updateComplaintStatus as jest.Mock).mockResolvedValue(mockUpdatedResult);

      const result = await complaintService.updateComplaintStatus(mockComplaintId, {
        status: 'RESOLVED',
      });

      expect(result.status).toBe('RESOLVED');
      expect(result.content).toBe('민원 내용');
    });
  });
});
