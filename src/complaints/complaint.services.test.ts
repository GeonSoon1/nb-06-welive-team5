process.env.JWT_ACCESS_TOKEN_SECRET = 'test-secret';
process.env.JWT_REFRESH_TOKEN_SECRET = 'test-refresh-secret';
process.env.AWS_REGION = 'ap-northeast-2';
process.env.AWS_ACCESS_KEY_ID = 'test-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
process.env.S3_BUCKET_NAME = 'test-bucket';
process.env.DATABASE_URL = 'postgresql://fake:fake@localhost:5432/fake';

import { Role, ComplaintStatus } from '@prisma/client';
import * as complaintService from './complaint.services';
import * as complaintRepository from './complaint.repository';
import * as notificationRepository from '../notifications/notification.repository';
import ForbiddenError from '../libs/errors/ForbiddenError';
import BadRequestError from '../libs/errors/BadRequestError';
import { GetComplaintsQueryDto } from './complaint.struct';
import { ComplaintListResponse, ComplaintDetailResponse } from './complaint.type';
import { prismaClient as prisma } from '../libs/constants';
import * as userRepository from '../users/user.repository';

jest.mock('./complaint.repository');
jest.mock('../notifications/notification.repository');
jest.mock('../libs/constants', () => ({
  prismaClient: {
    apartment: { findUnique: jest.fn() },
  },
  NotificationType: {
    COMPLAINT_REQ: 'COMPLAINT_REQ',
    COMPLAINT_IN_PROGRESS: 'COMPLAINT_IN_PROGRESS',
    COMPLAINT_RESOLVED: 'COMPLAINT_RESOLVED',
    COMPLAINT_REJECTED: 'COMPLAINT_REJECTED',
  },
}));
jest.mock('../users/user.repository');

describe('Complaint Service 최종 통합 테스트', () => {
  const mockDate = new Date();
  const mockApartmentId = 'apt-123';
  const mockUserId = 'user-1';
  const mockAdminId = 'admin-999';

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createComplaint', () => {
    it('민원 등록 성공 시 관리자에게 알림이 전송되어야 한다.', async () => {
      // 3. 테스트 내부에서 findAdminsByApartmentId가 반환할 가짜 데이터를 설정해줍니다.
      (userRepository.findAdminsByApartmentId as jest.Mock).mockResolvedValue([
        { id: mockAdminId, role: 'ADMIN' }, // 'admin-999'로 설정된 변수 사용
      ]);
      const dto = { title: '층간소음', content: '내용', isPublic: true };

      (complaintRepository.getBoardIdByApartment as jest.Mock).mockResolvedValue('board-1');
      (complaintRepository.createComplaint as jest.Mock).mockResolvedValue({
        id: 'comp-1',
        authorId: mockUserId,
        title: dto.title,
        content: dto.content,
        isPublic: dto.isPublic,
        createdAt: mockDate,
        updatedAt: mockDate,
        viewCount: 0,
        commentsCount: 0,
        status: ComplaintStatus.PENDING,
        author: { name: '홍길동' },
      });
      (prisma.apartment.findUnique as jest.Mock).mockResolvedValue({ adminId: mockAdminId });

      const result = await complaintService.createComplaint(mockUserId, mockApartmentId, dto);

      expect(complaintRepository.createComplaint).toHaveBeenCalledWith(mockUserId, 'board-1', dto);
      expect(notificationRepository.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ userId: mockAdminId, notificationType: 'COMPLAINT_REQ' }),
      );
      expect(result.complaintId).toBe('comp-1');
      expect(result.writerName).toBe('홍길동');
    });
  });

  describe('getComplaints', () => {
    it('비공개 민원을 타인이 조회하면 마스킹 처리되어야 한다.', async () => {
      const queryParams: GetComplaintsQueryDto = { page: '1', limit: '20' };
      const mockComplaint = {
        id: 'comp-1',
        authorId: 'other-user',
        isPublic: false,
        title: '비밀글',
        status: 'PENDING',
        createdAt: mockDate,
        author: { name: '홍길동', apartmentUnit: { dong: '101', ho: '102' } },
        viewCount: 0,
        commentsCount: 0,
      };

      (complaintRepository.getComplaints as jest.Mock).mockResolvedValue({
        complaints: [mockComplaint],
        totalCount: 1,
      });

      const result: { complaints: ComplaintListResponse[]; totalCount: number; } =
        await complaintService.getComplaints(mockApartmentId, mockUserId, Role.USER, queryParams);

      const { complaints } = result;

      expect(complaints[0]?.title).toBe('🔒 비공개 민원입니다.');
      expect(complaints[0]?.writerName).toBe('익명');
    });
  });

  describe('getComplaintDetail', () => {
    it('타 아파트 민원 접근 시 ForbiddenError를 던져야 한다.', async () => {
      (complaintRepository.validateComplaintOwnership as jest.Mock).mockResolvedValue(false);

      await expect(
        complaintService.getComplaintDetail('comp-1', mockUserId, Role.USER, mockApartmentId),
      ).rejects.toThrow(ForbiddenError);
    });

    it('본인 민원 상세 조회 시 전체 내용을 반환하고 조회수를 증가시켜야 한다.', async () => {
      const mockDetail = {
        id: 'comp-1',
        authorId: mockUserId,
        title: '내민원',
        content: '내용',
        isPublic: false,
        status: 'PENDING',
        createdAt: mockDate,
        viewCount: 0,
        commentsCount: 0,
        comments: [],
      };
      (complaintRepository.validateComplaintOwnership as jest.Mock).mockResolvedValue(true);
      (complaintRepository.getComplaintDetail as jest.Mock).mockResolvedValue(mockDetail);
      (complaintRepository.incrementComplaintViewCount as jest.Mock).mockResolvedValue(undefined);

      const result = await complaintService.getComplaintDetail(
        'comp-1',
        mockUserId,
        Role.USER,
        mockApartmentId,
      );

      expect(result.title).toBe('내민원');
      expect(result.content).toBe('내용');
      expect(complaintRepository.incrementComplaintViewCount).toHaveBeenCalledWith('comp-1');
    });
  });

  describe('updateUserComplaint', () => {
    it('상태가 PENDING이 아니면 수정을 거부해야 한다.', async () => {
      (complaintRepository.getComplaintById as jest.Mock).mockResolvedValue({
        authorId: mockUserId,
        status: 'IN_PROGRESS',
      });
      (complaintRepository.validateComplaintOwnership as jest.Mock).mockResolvedValue(true);

      await expect(
        complaintService.updateUserComplaint('comp-1', mockUserId, mockApartmentId, {
          title: '수정',
        }, Role.USER),
      ).rejects.toThrow(BadRequestError);
    });

    it('상태가 PENDING이면 성공적으로 수정되어야 한다.', async () => {
      (complaintRepository.getComplaintById as jest.Mock).mockResolvedValue({
        authorId: mockUserId,
        status: 'PENDING',
      });
      (complaintRepository.validateComplaintOwnership as jest.Mock).mockResolvedValue(true);
      (complaintRepository.updateUserComplaint as jest.Mock).mockResolvedValue({
        id: 'comp-1',
        authorId: mockUserId,
        title: '수정됨',
        isPublic: true,
        status: 'PENDING',
      });

      const result = await complaintService.updateUserComplaint(
        'comp-1',
        mockUserId,
        mockApartmentId,
        {
          title: '수정됨',
        }, Role.USER,
      );

      expect(complaintRepository.updateUserComplaint).toHaveBeenCalledWith(
        'comp-1',
        expect.any(Object),
      );
      expect(result.title).toBe('수정됨');
    });
  });

  // 5. 삭제 테스트
  describe('deleteUserComplaint', () => {
    it('정상적으로 삭제 요청이 전달되어야 한다.', async () => {
      (complaintRepository.getComplaintById as jest.Mock).mockResolvedValue({
        authorId: mockUserId,
        status: 'PENDING',
      });
      (complaintRepository.validateComplaintOwnership as jest.Mock).mockResolvedValue(true);

      await complaintService.deleteUserComplaint('comp-1', mockUserId, mockApartmentId, Role.USER);
      expect(complaintRepository.deleteUserComplaint).toHaveBeenCalledWith('comp-1');
    });
  });

  describe('updateComplaintStatus', () => {
    it('관리자가 상태 변경 시 작성자에게 알림이 가야 한다.', async () => {
      (complaintRepository.validateComplaintOwnership as jest.Mock).mockResolvedValue(true);
      (complaintRepository.updateComplaintStatus as jest.Mock).mockResolvedValue({
        id: 'comp-1',
        authorId: mockUserId,
        status: 'RESOLVED',
      });

      await complaintService.updateComplaintStatus('comp-1', mockApartmentId, {
        status: ComplaintStatus.RESOLVED,
      });

      expect(complaintRepository.updateComplaintStatus).toHaveBeenCalledWith(
        'comp-1',
        ComplaintStatus.RESOLVED,
      );
      expect(notificationRepository.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ userId: mockUserId, notificationType: 'COMPLAINT_RESOLVED' }),
      );
    });
  });
});
