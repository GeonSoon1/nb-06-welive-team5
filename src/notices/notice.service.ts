import { Prisma } from '../libs/constants';
import { CustomError } from '../libs/errors/errorHandler';
import { CreateNoticeDto, GetNoticeListDto, UpdateNoticeDto } from './notice.struct';
import * as noticeRepository from './notice.repository';

export const createNotice = async (userId: string, data: CreateNoticeDto) => {
    const { boardId, startDate, endDate, ...rest } = data;

    // Prisma.NoticeCreateInput 타입에 맞춰 데이터 변환
    const noticeData: any = {
        ...rest,
        startTime: startDate,
        endTime: endDate,
        apartmentboardId: boardId,
        author: { connect: { id: userId } },
    };

    return await noticeRepository.createNotice(noticeData);
};

export const getNoticeList = async (query: GetNoticeListDto) => {
    const { page, limit, category, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.NoticeWhereInput = {};
    if (category) where.category = category;
    if (search) {
        where.OR = [
            { title: { contains: search } },
            { content: { contains: search } }
        ];
    }

    const { totalCount, notices } = await noticeRepository.findNotices(skip, limit, where);

    return {
        notices: notices.map(notice => ({
            noticeId: notice.id,
            userId: notice.authorId,
            category: notice.category,
            title: notice.title,
            writerName: notice.author?.name || '알 수 없음',
            createdAt: notice.createdAt,
            updatedAt: notice.updatedAt,
            viewsCount: notice.viewCount,
            commentsCount: notice._count.comments,
            isPinned: notice.isPinned
        })),
        totalCount
    };
};

export const getNoticeDetail = async (noticeId: string) => {
    await noticeRepository.incrementViewCount(noticeId);

    const notice = await noticeRepository.findNoticeById(noticeId);
    if (!notice) throw new CustomError(404, '공지사항을 찾을 수 없습니다.');

    return {
        noticeId: notice.id,
        userId: notice.authorId,
        category: notice.category,
        title: notice.title,
        writerName: notice.author?.name || '알 수 없음',
        createdAt: notice.createdAt,
        updatedAt: notice.updatedAt,
        viewsCount: notice.viewCount,
        commentsCount: notice._count.comments,
        isPinned: notice.isPinned,
        content: notice.content,
        boardName: '공지사항',
        comments: notice.comments.map(comment => ({
            id: comment.id,
            userId: comment.authorId,
            content: comment.content,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            writerName: comment.author?.name || '알 수 없음'
        }))
    };
};

export const updateNotice = async (noticeId: string, userId: string, data: UpdateNoticeDto) => {
    const notice = await noticeRepository.findNoticeById(noticeId);
    if (!notice) throw new CustomError(404, '공지사항을 찾을 수 없습니다.');
    if (notice.authorId !== userId) throw new CustomError(403, '권한이 없습니다.');

    const { boardId, startDate, endDate, ...rest } = data;
    const updateData: any = { ...rest };
    if (boardId) updateData.apartmentboardId = boardId;
    if (startDate) updateData.startTime = startDate;
    if (endDate) updateData.endTime = endDate;

    const updated = await noticeRepository.updateNotice(noticeId, updateData);

    return {
        noticeId: updated.id,
        userId: updated.authorId,
        category: updated.category,
        title: updated.title,
        writerName: notice.author?.name || '알 수 없음',
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        viewsCount: updated.viewCount,
        commentsCount: notice._count.comments,
        isPinned: updated.isPinned
    };
};

export const deleteNotice = async (noticeId: string, userId: string) => {
    const notice = await noticeRepository.findNoticeById(noticeId);
    if (!notice) throw new CustomError(404, '공지사항을 찾을 수 없습니다.');
    if (notice.authorId !== userId) throw new CustomError(403, '권한이 없습니다.');

    await noticeRepository.deleteNotice(noticeId);
};