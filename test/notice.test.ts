import * as noticeService from '../src/notices/notice.service';
import * as noticeRepository from '../src/notices/notice.repository';
import { CustomError } from '../src/libs/errors/errorHandler';

jest.mock('../src/notices/notice.repository');

describe('Notice Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getNoticeDetail', () => {
        it('공지사항 조회 성공 시 조회수를 증가시키고 +1을 반영한 객체를 반환해야 한다', async () => {
            // Given
            const mockNotice = {
                id: 'notice-1',
                authorId: 'user-1',
                category: 'GENERAL',
                title: '기본 공지',
                createdAt: new Date(),
                updatedAt: new Date(),
                viewCount: 10,
                _count: { comments: 5 },
                isPinned: false,
                content: '내용',
                author: { name: '홍길동' },
                comments: [],
            };
            (noticeRepository.findNoticeById as jest.Mock).mockResolvedValue(mockNotice);
            (noticeRepository.incrementViewCount as jest.Mock).mockResolvedValue(undefined);

            // When
            const result = await noticeService.getNoticeDetail('notice-1');

            // Then
            expect(noticeRepository.findNoticeById).toHaveBeenCalledWith('notice-1');
            expect(noticeRepository.incrementViewCount).toHaveBeenCalledWith('notice-1');
            expect(result.title).toBe('기본 공지');
            expect(result.viewsCount).toBe(11); // DB의 기존 값 10 + 1 처리됨
        });

        it('공지사항이 없으면 CustomError(404)를 발생시켜야 한다', async () => {
            (noticeRepository.findNoticeById as jest.Mock).mockResolvedValue(null);

            await expect(noticeService.getNoticeDetail('invalid')).rejects.toThrow(CustomError);
        });
    });
});