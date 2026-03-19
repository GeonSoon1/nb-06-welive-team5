// constants.ts의 필수 환경 변수 검증을 통과하기 위한 가짜 값 설정
process.env.JWT_ACCESS_TOKEN_SECRET = 'test-secret';
process.env.JWT_REFRESH_TOKEN_SECRET = 'test-refresh-secret';
process.env.AWS_REGION = 'ap-northeast-2';
process.env.AWS_ACCESS_KEY_ID = 'test-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
process.env.S3_BUCKET_NAME = 'test-bucket';
process.env.DATABASE_URL = 'postgresql://fake:fake@localhost:5432/fake';

import { Role } from '@prisma/client';
import * as complaintService from './complaint.services';
import * as complaintRepository from './complaint.repository';
import ForbiddenError from '../libs/errors/ForbiddenError';
import { GetComplaintsQueryDto } from './complaint.struct';

jest.mock('./complaint.repository');

describe('Complaint Service 리팩토링 버전 테스트', () => {
  const mockDate = new Date();
  const mockApartmentId = 'apt-123';
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

  describe('getComplaints (전체 민원 조회)', () => {
    it('아파트 ID와 쿼리를 받아 목록을 반환해야 한다.', async () => {
      const queryParams: GetComplaintsQueryDto = { page: '1', limit: '20' };

      (complaintRepository.getComplaints as jest.Mock).mockResolvedValue({
        complaints: [],
        totalCount: 0,
      });

      await complaintService.getComplaints(mockApartmentId, mockUserId, Role.USER, queryParams);

      expect(complaintRepository.getComplaints).toHaveBeenCalledWith(mockApartmentId, queryParams);
    });
  });

  describe('getComplaintDetail (민원 상세 조회)', () => {
    const mockComplaintId = 'comp-1';

    it('우리 아파트 민원이 아니면 ForbiddenError를 던져야 한다 (보안 검증)', async () => {
      (complaintRepository.validateComplaintOwnership as jest.Mock).mockResolvedValue(false);

      await expect(
        complaintService.getComplaintDetail(
          mockComplaintId,
          mockUserId,
          Role.USER,
          mockApartmentId,
        ),
      ).rejects.toThrow(ForbiddenError);

      expect(complaintRepository.validateComplaintOwnership).toHaveBeenCalledWith(
        mockComplaintId,
        mockApartmentId,
      );
    });

    it('우리 아파트 민원이 맞고 공개글이면 상세 정보를 반환해야 한다.', async () => {
      const mockComplaint = {
        id: mockComplaintId,
        authorId: 'other-user',
        title: '공개 민원',
        content: '내용',
        isPublic: true,
        viewCount: 0,
        status: 'PENDING',
        createdAt: mockDate,
        author: { name: '작성자', apartmentUnit: { dong: '101', ho: '101' } },
        comments: [],
      };

      (complaintRepository.validateComplaintOwnership as jest.Mock).mockResolvedValue(true);
      (complaintRepository.getComplaintDetail as jest.Mock).mockResolvedValue(mockComplaint);

      const result = await complaintService.getComplaintDetail(
        mockComplaintId,
        mockUserId,
        Role.USER,
        mockApartmentId,
      );

      expect(result.complaintId).toBe(mockComplaintId);
      expect(complaintRepository.incrementComplaintViewCount).toHaveBeenCalledWith(mockComplaintId);
    });
  });

  describe('updateUserComplaint (민원 수정)', () => {
    const mockComplaintId = 'comp-update';
    const updateDto = { title: '수정 제목', content: '수정 내용', isPublic: true };

    it('작성자 본인이더라도 타 아파트 민원이면 수정을 거부해야 한다.', async () => {
      (complaintRepository.getComplaintById as jest.Mock).mockResolvedValue({
        authorId: mockUserId,
        status: 'PENDING',
      });
      (complaintRepository.validateComplaintOwnership as jest.Mock).mockResolvedValue(false);

      await expect(
        complaintService.updateUserComplaint(
          mockComplaintId,
          mockUserId,
          mockApartmentId,
          updateDto,
        ),
      ).rejects.toThrow(ForbiddenError);
    });

    it('모든 검증을 통과하면 수정을 완료하고 결과를 반환한다.', async () => {
      (complaintRepository.getComplaintById as jest.Mock).mockResolvedValue({
        authorId: mockUserId,
        status: 'PENDING',
      });
      (complaintRepository.validateComplaintOwnership as jest.Mock).mockResolvedValue(true);
      (complaintRepository.updateUserComplaint as jest.Mock).mockResolvedValue({
        id: mockComplaintId,
        authorId: mockUserId,
        title: updateDto.title,
        status: 'PENDING',
        createdAt: mockDate,
        author: { name: '본인' },
      });

      const result = await complaintService.updateUserComplaint(
        mockComplaintId,
        mockUserId,
        mockApartmentId,
        updateDto,
      );

      expect(result.title).toBe(updateDto.title);
      expect(complaintRepository.updateUserComplaint).toHaveBeenCalled();
    });
  });

  describe('deleteUserComplaint (민원 삭제)', () => {
    it('아파트 소유권 검증에 실패하면 삭제할 수 없다.', async () => {
      (complaintRepository.getComplaintById as jest.Mock).mockResolvedValue({
        authorId: mockUserId,
        status: 'PENDING',
      });
      (complaintRepository.validateComplaintOwnership as jest.Mock).mockResolvedValue(false);

      await expect(
        complaintService.deleteUserComplaint('comp-delete', mockUserId, mockApartmentId),
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
