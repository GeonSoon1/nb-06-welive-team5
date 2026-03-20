// constants.ts의 필수 환경 변수 검증을 통과하기 위한 가짜 값 설정
process.env.JWT_ACCESS_TOKEN_SECRET = 'test-secret';
process.env.JWT_REFRESH_TOKEN_SECRET = 'test-refresh-secret';
process.env.AWS_REGION = 'ap-northeast-2';
process.env.AWS_ACCESS_KEY_ID = 'test-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
process.env.S3_BUCKET_NAME = 'test-bucket';
process.env.DATABASE_URL = 'postgresql://fake:fake@localhost:5432/fake';

import { Role, BoardType } from '@prisma/client';
import * as commentService from './comment.services';
import * as commentRepository from './comment.repository';
import ForbiddenError from '../libs/errors/ForbiddenError';
import NotFoundError from '../libs/errors/NotFoundError';
import BadRequestError from '../libs/errors/BadRequestError';
import { CreateCommentDto, UpdateCommentDto } from './comment.struct';

jest.mock('./comment.repository');

describe('Comment Service 통합 테스트', () => {
  const mockDate = new Date();
  const mockApartmentId = 'apt-123';
  const mockUserId = 'user-1';
  const mockOtherUserId = 'user-2';

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createComment', () => {
    const createDto: CreateCommentDto = {
      content: '테스트 댓글',
      boardType: BoardType.COMPLAINT,
      boardId: 'complaint-1',
    };

    it('본인 아파트 게시글에 댓글을 성공적으로 등록해야 한다.', async () => {
      (commentRepository.validateBoardOwnership as jest.Mock).mockResolvedValue(true);

      const mockNewComment = {
        id: 'comm-1',
        authorId: mockUserId,
        content: createDto.content,
        createdAt: mockDate,
        updatedAt: mockDate,
        complaintId: createDto.boardId,
        author: { name: '홍길동' },
      };
      (commentRepository.createComment as jest.Mock).mockResolvedValue(mockNewComment);

      const result = await commentService.createComment(mockUserId, mockApartmentId, createDto);

      expect(result.comment.content).toBe('테스트 댓글');
      expect(result.comment.writerName).toBe('홍길동');
      expect(result.board.id).toBe('complaint-1');
      expect(commentRepository.validateBoardOwnership).toHaveBeenCalledWith(
        createDto.boardId,
        createDto.boardType,
        mockApartmentId,
      );
    });

    it('타 아파트 게시글에 댓글 등록 시 ForbiddenError를 던져야 한다.', async () => {
      (commentRepository.validateBoardOwnership as jest.Mock).mockResolvedValue(false);

      await expect(
        commentService.createComment(mockUserId, mockApartmentId, createDto),
      ).rejects.toThrow(ForbiddenError);
    });

    it('댓글 등록 DB 처리에 실패하면 BadRequestError를 던져야 한다.', async () => {
      (commentRepository.validateBoardOwnership as jest.Mock).mockResolvedValue(true);
      (commentRepository.createComment as jest.Mock).mockResolvedValue(null);

      await expect(
        commentService.createComment(mockUserId, mockApartmentId, createDto),
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('updateComment', () => {
    const updateDto: UpdateCommentDto = {
      content: '수정된 댓글',
      boardType: BoardType.COMPLAINT,
      boardId: 'complaint-1',
    };

    it('본인이 작성한 댓글은 수정이 가능해야 한다.', async () => {
      const mockExistingComment = { id: 'comm-1', authorId: mockUserId };
      (commentRepository.getCommentById as jest.Mock).mockResolvedValue(mockExistingComment);
      (commentRepository.validateBoardOwnership as jest.Mock).mockResolvedValue(true);
      (commentRepository.updateComment as jest.Mock).mockResolvedValue({
        ...mockExistingComment,
        content: '수정된 댓글',
        author: { name: '홍길동' },
        complaintId: 'complaint-1',
        createdAt: mockDate,
        updatedAt: mockDate,
      });

      const result = await commentService.updateComment(
        'comm-1',
        mockUserId,
        mockApartmentId,
        updateDto,
      );

      expect(result.comment.content).toBe('수정된 댓글');
      expect(commentRepository.updateComment).toHaveBeenCalled();
    });

    it('타인이 작성한 댓글 수정 시 ForbiddenError를 던져야 한다.', async () => {
      (commentRepository.getCommentById as jest.Mock).mockResolvedValue({
        authorId: mockOtherUserId,
      });

      await expect(
        commentService.updateComment('comm-1', mockUserId, mockApartmentId, updateDto),
      ).rejects.toThrow(ForbiddenError);
    });

    it('존재하지 않는 댓글 수정 시 NotFoundError를 던져야 한다.', async () => {
      (commentRepository.getCommentById as jest.Mock).mockResolvedValue(null);

      await expect(
        commentService.updateComment('invalid-id', mockUserId, mockApartmentId, updateDto),
      ).rejects.toThrow(NotFoundError);
    });

    it('본인 댓글이더라도 타 아파트 게시글이면 수정을 거부해야 한다.', async () => {
      (commentRepository.getCommentById as jest.Mock).mockResolvedValue({
        authorId: mockUserId,
      });
      (commentRepository.validateBoardOwnership as jest.Mock).mockResolvedValue(false);

      await expect(
        commentService.updateComment('comm-1', mockUserId, mockApartmentId, updateDto),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('deleteComment', () => {
    it('작성자는 본인 댓글을 삭제할 수 있다.', async () => {
      (commentRepository.getCommentById as jest.Mock).mockResolvedValue({
        id: 'comm-1',
        authorId: mockUserId,
      });

      await commentService.deleteComment('comm-1', mockUserId, Role.USER);

      expect(commentRepository.deleteComment).toHaveBeenCalledWith('comm-1');
    });

    it('관리자는 타인의 댓글도 삭제할 수 있다.', async () => {
      (commentRepository.getCommentById as jest.Mock).mockResolvedValue({
        id: 'comm-1',
        authorId: mockOtherUserId,
      });

      await commentService.deleteComment('comm-1', 'admin-1', Role.ADMIN);

      expect(commentRepository.deleteComment).toHaveBeenCalledWith('comm-1');
    });

    it('일반 유저가 타인의 댓글 삭제 시 ForbiddenError를 던져야 한다.', async () => {
      (commentRepository.getCommentById as jest.Mock).mockResolvedValue({
        id: 'comm-1',
        authorId: mockOtherUserId,
      });

      await expect(commentService.deleteComment('comm-1', mockUserId, Role.USER)).rejects.toThrow(
        ForbiddenError,
      );
    });

    it('존재하지 않는 댓글 삭제 시 NotFoundError를 던져야 한다.', async () => {
      (commentRepository.getCommentById as jest.Mock).mockResolvedValue(null);

      await expect(
        commentService.deleteComment('invalid-id', mockUserId, Role.USER),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
