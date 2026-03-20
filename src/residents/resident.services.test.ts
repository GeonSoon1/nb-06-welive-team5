// constants.ts의 필수 환경 변수 검증을 통과하기 위한 가짜 값 설정
process.env.JWT_ACCESS_TOKEN_SECRET = 'test-secret';
process.env.JWT_REFRESH_TOKEN_SECRET = 'test-refresh-secret';
process.env.AWS_REGION = 'ap-northeast-2';
process.env.AWS_ACCESS_KEY_ID = 'test-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
process.env.S3_BUCKET_NAME = 'test-bucket';
process.env.DATABASE_URL = 'postgresql://fake:fake@localhost:5432/fake';

import * as residentService from './resident.services';
import * as residentRepository from './resident.repository';
import { GetResidentsQueryDto } from './resident.struct';
import BadRequestError from '../libs/errors/BadRequestError';
import { prismaClient } from '../libs/constants';
import { ResidenceStatus } from '@prisma/client';

jest.mock('../libs/constants', () => ({
  prismaClient: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('./resident.repository');

describe('Resident Service 유닛 테스트', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getResidents (입주민 목록 조회)', () => {
    it('아파트 ID와 쿼리 파라미터를 그대로 Repository에 전달하여 목록을 반환해야 한다.', async () => {
      const mockApartmentId = 'apt-1234';
      const queryParams: GetResidentsQueryDto = {
        page: '2',
        limit: '10',
        building: '101',
        residenceStatus: ResidenceStatus.RESIDENCE,
      };

      (residentRepository.findResidentsByApartment as jest.Mock).mockResolvedValue({
        residents: [],
        totalCount: 0,
      });

      await residentService.getResidents(mockApartmentId, queryParams);

      expect(residentRepository.findResidentsByApartment).toHaveBeenCalledWith(
        mockApartmentId,
        queryParams,
      );
    });

    it('Repository 조회 결과가 없으면(null) BadRequestError를 던져야 한다.', async () => {
      (residentRepository.findResidentsByApartment as jest.Mock).mockResolvedValue(null);

      await expect(residentService.getResidents('apt-1234', {})).rejects.toThrow(BadRequestError);
    });
  });

  describe('createResident (입주민 개별 등록)', () => {
    it('아파트 ID와 생성 데이터(DTO)를 Repository에 전달하여 생성을 요청해야 한다.', async () => {
      const mockApartmentId = 'apt-1234';
      const mockDto = {
        name: '홍길동',
        building: '101',
        unitNumber: '101',
        contact: '01059336890',
        isHouseholder: 'HOUSEHOLDER' as const,
      };

      const expectedDbResult = {
        id: 'res-1',
        apartmentId: mockApartmentId,
        name: '홍길동',
        dong: '101',
        ho: '101',
        contact: '01059336890',
        isHouseholder: 'HOUSEHOLDER',
        residenceStatus: 'RESIDENCE',
      };

      (residentRepository.createResident as jest.Mock).mockResolvedValue(expectedDbResult);

      const result = await residentService.createResident(mockApartmentId, mockDto);

      expect(residentRepository.createResident).toHaveBeenCalledWith(mockApartmentId, mockDto);
      expect(result).toEqual(expectedDbResult);
    });

    it('레포지토리에서 생성이 실패하면 BadRequestError를 던져야 한다.', async () => {
      (residentRepository.createResident as jest.Mock).mockResolvedValue(null);

      await expect(
        residentService.createResident('apt-1234', {
          name: '아무개',
          building: '101',
          unitNumber: '102',
          contact: '01000000000',
          isHouseholder: 'MEMBER',
        }),
      ).rejects.toThrow(BadRequestError);
    });
  });
  describe('createResidentFromUser (사용자로부터 입주민 생성)', () => {
    it('유저 정보를 조회하여 DTO를 구성한 뒤 createResident(레포지토리)를 호출해야 한다.', async () => {
      const mockApartmentId = 'apt-1234';
      const mockUserId = 'user-123';

      const mockUser = {
        id: mockUserId,
        name: '김유저',
        contact: '01011112222',
        apartmentUnit: { dong: '105', ho: '202' },
      };
      (prismaClient.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const expectedDbResult = {
        id: 'res-1',
        apartmentId: mockApartmentId,
        name: mockUser.name,
        contact: mockUser.contact,
        dong: '105',
        ho: '202',
        isHouseholder: 'MEMBER',
        residenceStatus: 'RESIDENCE',
      };
      (residentRepository.createResident as jest.Mock).mockResolvedValue(expectedDbResult);

      await residentService.createResidentFromUser(mockApartmentId, mockUserId);

      expect(prismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
        include: { apartmentUnit: true },
      });

      expect(residentRepository.createResident).toHaveBeenCalledWith(mockApartmentId, {
        name: '김유저',
        contact: '01011112222',
        building: '105',
        unitNumber: '202',
        isHouseholder: 'MEMBER',
      });
    });

    it('조회된 유저 정보가 없으면 BadRequestError를 던져야 한다.', async () => {
      (prismaClient.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        residentService.createResidentFromUser('apt-1234', 'invalid-id'),
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('getCsvTemplate (템플릿 다운로드 서비스)', () => {
    it('지정된 헤더(이름, 연락처 등)가 포함된 CSV 스트림을 반환해야 한다.', async () => {
      const stream = await residentService.getCsvTemplate();

      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const resultString = Buffer.concat(chunks).toString('utf-8');

      expect(resultString).toContain('이름');
      expect(resultString).toContain('연락처');
      expect(resultString).toContain('동');
      expect(resultString).toContain('호');
      expect(resultString).toContain('세대주여부');
    });
  });

  describe('uploadResidentsFromCsv (CSV 파일 업로드 서비스)', () => {
    it('CSV 버퍼를 파싱하여 DB 스키마에 맞게 변환 후 createManyResidents를 호출해야 한다.', async () => {
      const mockApartmentId = 'apt-1234';
      const mockCsvContent = `이름,연락처,동,호,세대주여부\n김철수,01012345678,101,101,세대주\n이영희,01098765432,102,202,세대원`;
      const mockBuffer = Buffer.from(mockCsvContent, 'utf-8');

      (residentRepository.createManyResidents as jest.Mock).mockResolvedValue({
        count: 2,
      });

      const result = await residentService.uploadResidentsFromCsv(mockApartmentId, mockBuffer);

      expect(result.count).toBe(2);

      expect(residentRepository.createManyResidents).toHaveBeenCalledTimes(1);
      expect(residentRepository.createManyResidents).toHaveBeenCalledWith([
        {
          apartmentId: mockApartmentId,
          name: '김철수',
          contact: '01012345678',
          dong: '101',
          ho: '101',
          isHouseholder: 'HOUSEHOLDER',
        },
        {
          apartmentId: mockApartmentId,
          name: '이영희',
          contact: '01098765432',
          dong: '102',
          ho: '202',
          isHouseholder: 'MEMBER',
        },
      ]);
    });

    it('레포지토리에서 생성이 실패하면 BadRequestError를 던져야 한다.', async () => {
      const mockBuffer = Buffer.from('이름\n테스트', 'utf-8');
      (residentRepository.createManyResidents as jest.Mock).mockResolvedValue(null);

      await expect(residentService.uploadResidentsFromCsv('apt-1234', mockBuffer)).rejects.toThrow(
        BadRequestError,
      );
    });
  });

  describe('exportResidentsToCsv (입주민 목록 다운로드 서비스)', () => {
    it('DB에서 데이터를 한 번에(limit 10000) 조회하여 CSV 스트림으로 변환해 반환해야 한다.', async () => {
      const mockApartmentId = 'apt-1234';
      const mockResidents = [
        {
          name: '김철수',
          contact: '01011112222',
          dong: '101',
          ho: '101',
          isHouseholder: 'HOUSEHOLDER',
        },
        {
          name: '이영희',
          contact: '01033334444',
          dong: '101',
          ho: '102',
          isHouseholder: 'MEMBER',
        },
      ];

      (residentRepository.findResidentsByApartment as jest.Mock).mockResolvedValue({
        residents: mockResidents,
      });

      const queryParams: GetResidentsQueryDto = { building: '101' };
      const stream = await residentService.exportResidentsToCsv(mockApartmentId, queryParams);

      expect(residentRepository.findResidentsByApartment).toHaveBeenCalledWith(
        mockApartmentId,
        expect.objectContaining({
          building: '101',
          limit: '10000',
        }),
      );

      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const resultString = Buffer.concat(chunks).toString('utf-8');

      expect(resultString).toContain('김철수,01011112222,101,101,세대주');
      expect(resultString).toContain('이영희,01033334444,101,102,세대원');
    });

    it('목록 조회에 실패하면 BadRequestError를 던져야 한다.', async () => {
      (residentRepository.findResidentsByApartment as jest.Mock).mockResolvedValue({
        residents: null,
      });

      await expect(residentService.exportResidentsToCsv('apt-1234', {})).rejects.toThrow(
        BadRequestError,
      );
    });
  });

  describe('getResidentDetail (입주민 상세 조회 서비스)', () => {
    it('요청받은 ID로 레포지토리에서 입주민 정보를 조회하여 반환해야 한다.', async () => {
      const mockResidentId = 'res-1';
      const mockDbResult = {
        id: mockResidentId,
        name: '김철수',
        dong: '101',
        ho: '101',
      };

      (residentRepository.findResidentById as jest.Mock).mockResolvedValue(mockDbResult);

      const result = await residentService.getResidentDetail(mockResidentId);

      expect(residentRepository.findResidentById).toHaveBeenCalledWith(mockResidentId);
      expect(result).toEqual(mockDbResult);
    });

    it('조회된 입주민 정보가 없으면 BadRequestError를 던져야 한다.', async () => {
      (residentRepository.findResidentById as jest.Mock).mockResolvedValue(null);

      await expect(residentService.getResidentDetail('invalid-id')).rejects.toThrow(
        BadRequestError,
      );
    });
  });

  describe('updateResident (입주민 정보 수정 서비스)', () => {
    it('존재하는 입주민의 정보를 수정하고 변경된 데이터를 반환해야 한다.', async () => {
      const mockId = 'res-1';
      const mockUpdateData = {
        name: '홍길동(수정)',
        building: '101',
        unitNumber: '102',
        contact: '01059336890',
        isHouseholder: 'HOUSEHOLDER' as const,
      };

      (residentRepository.findResidentById as jest.Mock).mockResolvedValue({
        id: mockId,
        name: '기존이름',
      });

      const mockUpdatedResult = {
        id: mockId,
        dong: '101',
        ho: '102',
        name: '홍길동(수정)',
      };
      (residentRepository.updateResident as jest.Mock).mockResolvedValue(mockUpdatedResult);

      const result = await residentService.updateResident(mockId, mockUpdateData);

      expect(residentRepository.findResidentById).toHaveBeenCalledWith(mockId);
      expect(residentRepository.updateResident).toHaveBeenCalledWith(mockId, mockUpdateData);
      expect(result).toEqual(mockUpdatedResult);
    });

    it('존재하지 않는 입주민을 수정하려 하면 BadRequestError를 던져야 한다.', async () => {
      (residentRepository.findResidentById as jest.Mock).mockResolvedValue(null);

      await expect(
        residentService.updateResident('invalid-id', { name: '이름수정' }),
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('deleteResident (입주민 삭제 서비스)', () => {
    it('존재하는 입주민 정보를 확인한 후 삭제(Repository 호출)를 수행해야 한다.', async () => {
      const mockId = 'res-1';

      (residentRepository.findResidentById as jest.Mock).mockResolvedValue({
        id: mockId,
        name: '홍길동',
      });

      (residentRepository.deleteResident as jest.Mock).mockResolvedValue({
        id: mockId,
      });

      await residentService.deleteResident(mockId);

      expect(residentRepository.findResidentById).toHaveBeenCalledWith(mockId);
      expect(residentRepository.deleteResident).toHaveBeenCalledWith(mockId);
    });

    it('존재하지 않는 입주민을 삭제하려 하면 BadRequestError를 던져야 한다.', async () => {
      (residentRepository.findResidentById as jest.Mock).mockResolvedValue(null);

      await expect(residentService.deleteResident('invalid-id')).rejects.toThrow(BadRequestError);
    });
  });
});
