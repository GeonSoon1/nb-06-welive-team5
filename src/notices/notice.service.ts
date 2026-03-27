import { Role } from '@prisma/client';
import { Prisma, prismaClient } from '../libs/constants';
import { CustomError } from '../libs/errors/errorHandler';
import { CreateNoticeDto, GetNoticeListDto, UpdateNoticeDto } from './notice.struct';
import * as noticeRepository from './notice.repository';
import ForbiddenError from '../libs/errors/ForbiddenError';

export const createNotice = async (userId: string, data: CreateNoticeDto) => {
    const { boardId, startDate, endDate, ...rest } = data;

    // Prisma.NoticeCreateInput 타입에 맞춰 데이터 변환
    const noticeData: Prisma.NoticeCreateInput = {
        ...rest,
        startDate: startDate,
        endDate: endDate,
        apartmentboard: { connect: { id: boardId } },
        author: { connect: { id: userId } },
    };

    return await noticeRepository.createNotice(noticeData);
};

export const getNoticeList = async (query: GetNoticeListDto, apartmentId: string | null, role: Role) => {
    //필터 필요 지금은 다른아파트 사람이 해당아파트 투표확인 가능 -todo
    const { page, limit, category, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.NoticeWhereInput = {};

    // SUPER_ADMIN이 아닌 경우, 자신이 속한 아파트의 공지사항만 조회하도록 필터링
    if (role !== Role.SUPER_ADMIN) {
        if (!apartmentId) throw new ForbiddenError('소속된 아파트 정보가 없습니다.');
        where.apartmentboard = {
            apartment: { id: apartmentId }
        };
    }

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

export const getNoticeDetail = async (noticeId: string, apartmentId: string | null, role: Role) => {

    const notice = await noticeRepository.findNoticeById(noticeId);
    if (!notice) throw new CustomError(404, '공지사항을 찾을 수 없습니다.');

    // SUPER_ADMIN이 아닌 경우, 해당 공지사항이 자신의 아파트 소속인지 확인
    if (role !== Role.SUPER_ADMIN) {
        if (!apartmentId) throw new ForbiddenError('소속된 아파트 정보가 없습니다.');
        const accessCheck = await prismaClient.notice.findFirst({
            where: {
                id: noticeId,
                apartmentboard: { apartment: { id: apartmentId } }
            }
        });
        if (!accessCheck) throw new ForbiddenError('해당 공지사항에 접근 권한이 없습니다.');
    }


    await noticeRepository.incrementViewCount(noticeId);
    return {
        noticeId: notice.id,
        userId: notice.authorId,
        category: notice.category,
        title: notice.title,
        writerName: notice.author?.name || '알 수 없음',
        createdAt: notice.createdAt,
        updatedAt: notice.updatedAt,
        //위 increamentViewCount 에서 DB에 카운트를 올렸으나 사용자에게는 반영이 되지 않았기에 +1 추가
        viewsCount: notice.viewCount + 1,
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

export const updateNotice = async (noticeId: string, userId: string, userRole: Role, data: UpdateNoticeDto) => {
    const notice = await noticeRepository.findNoticeById(noticeId);
    if (!notice) throw new CustomError(404, '공지사항을 찾을 수 없습니다.');

    // 권한 검사: 작성자 본인 혹은 관리자 확인
    const isOwner = notice.authorId === userId;
    const isAdmin = userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN;
    if (!isOwner && !isAdmin) throw new ForbiddenError('자신이 작성한 공지사항만 수정하거나 관리자 권한이 필요합니다.');

    const { boardId, startDate, endDate, ...rest } = data;
    const updateData: Prisma.NoticeUpdateInput = {
        ...rest,
        ...(boardId && { apartmentboard: { connect: { id: boardId } } }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
    };

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

export const deleteNotice = async (noticeId: string, userId: string, userRole: Role) => {
    const notice = await noticeRepository.findNoticeById(noticeId);
    if (!notice) throw new CustomError(404, '공지사항을 찾을 수 없습니다.');

    // 권한 검사: 작성자 본인 혹은 관리자 확인
    const isOwner = notice.authorId === userId;
    const isAdmin = userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN;
    if (!isOwner && !isAdmin) throw new ForbiddenError('자신이 작성한 공지사항만 삭제하거나 관리자 권한이 필요합니다.');

    await noticeRepository.deleteNotice(noticeId);
};