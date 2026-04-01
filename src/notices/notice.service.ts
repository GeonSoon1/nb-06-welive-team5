import { Role, Vote, VoteOption, NoticeCategory } from '@prisma/client';
import { Prisma, prismaClient } from '../libs/constants';
import { CustomError } from '../libs/errors/errorHandler';
import { CreateNoticeDto, GetNoticeListDto, UpdateNoticeDto } from './notice.struct';
import * as noticeRepository from './notice.repository';
import ForbiddenError from '../libs/errors/ForbiddenError';
import { sendNotificationToUser } from '../notifications/notification.service';
import * as userRepository from '../users/user.repository';
import BadRequestError from '../libs/errors/BadRequestError';
import * as eventRepository from '../events/event.repository';

function validateNoticeSchedule(startDate?: Date, endDate?: Date) {
    if ((startDate && !endDate) || (!startDate && endDate)) {
        throw new BadRequestError('일정 등록 시 시작일과 종료일을 모두 입력해야 합니다.');
    }

    if (startDate && endDate && startDate > endDate) {
        throw new BadRequestError('종료일은 시작일보다 빠를 수 없습니다.');
    }
}

export const createNotice = async (userId: string, data: CreateNoticeDto) => {
    const { boardId, startDate, endDate, ...rest } = data;
    validateNoticeSchedule(startDate, endDate);

    const user = await prismaClient.user.findUnique({
        where: { id: userId },
        select: {
            apartment: {
                select: {
                    id: true,
                    apartmentboardId: true,
                },
            },
        },
    });

    if (!user || !user.apartment || !user.apartment.id || !user.apartment.apartmentboardId) {
        throw new BadRequestError('해당 사용자의 아파트 게시판 정보를 찾을 수 없습니다.');
    }

    const apartmentId = user.apartment.id;
    const realBoardId = user.apartment.apartmentboardId;

    const noticeData: Prisma.NoticeCreateInput = {
        ...rest,
        startDate: startDate,
        endDate: endDate,
        apartmentboard: { connect: { id: realBoardId } },
        author: { connect: { id: userId } },
    };

    const newNotice = await prismaClient.$transaction(async (tx) => {
        const createdNotice = await noticeRepository.createNotice(noticeData, tx);

        if (createdNotice.startDate && createdNotice.endDate) {
            await eventRepository.upsertEvent(
                {
                    boardType: 'NOTICE',
                    boardId: createdNotice.id,
                    startDate: createdNotice.startDate,
                    endDate: createdNotice.endDate,
                },
                tx,
            );
        }

        return createdNotice;
    });

    // 실시간 알림 전송 (아파트의 모든 입주민에게)
    const residents = await userRepository.findUsersByApartmentIdAndRole(
        prismaClient,
        apartmentId,
        Role.USER
    );

    if (residents.length > 0) {
        const notificationPromises = residents.map((resident) =>
            sendNotificationToUser({
                userId: resident.id,
                content: `새로운 공지사항이 등록되었습니다: ${newNotice.title}`,
                notificationType: 'NOTICE_REG',
                noticeId: newNotice.id,
            })
        );
        await Promise.all(notificationPromises);
    }

    return newNotice;
};

export const getNoticeList = async (query: GetNoticeListDto, apartmentId: string | null, role: Role) => {
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
    //-todo 슈퍼 어드민이 아닌 경우 자신의 아파트 만 업데이트 가능하도록 수정이 필요
    const { boardId, startDate, endDate, ...rest } = data;
    const effectiveStartDate = startDate ?? notice.startDate ?? undefined;
    const effectiveEndDate = endDate ?? notice.endDate ?? undefined;
    validateNoticeSchedule(effectiveStartDate, effectiveEndDate);

    const updateData: Prisma.NoticeUpdateInput = {
        ...rest,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
    };

    const updated = await prismaClient.$transaction(async (tx) => {
        const updatedNotice = await noticeRepository.updateNotice(noticeId, updateData, tx);

        if (updatedNotice.startDate && updatedNotice.endDate) {
            await eventRepository.upsertEvent(
                {
                    boardType: 'NOTICE',
                    boardId: updatedNotice.id,
                    startDate: updatedNotice.startDate,
                    endDate: updatedNotice.endDate,
                },
                tx,
            );
        }

        return updatedNotice;
    });

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

    //-todo 슈퍼 어드민이 아닌 경우 자신의 아파트 만 삭제 가능하도록 수정이 필요
    await noticeRepository.deleteNotice(noticeId);
};

export const createNoticeFromPoll = async (poll: Vote & { voteOptions: VoteOption[]; }) => {
    const totalVotes = poll.voteOptions.reduce((acc, option) => acc + option.voteCount, 0);

    const optionsSummary = poll.voteOptions
        .map(option => {
            const percentage = totalVotes > 0 ? ((option.voteCount / totalVotes) * 100).toFixed(2) : 0;
            return `* ${option.content}: ${option.voteCount}표 (${percentage}%)`;
        })
        .join('\n');

    const noticeContent = `투표가 종료되어 결과를 알려드립니다.\n\n` +
        `총 투표 수: ${totalVotes}표\n\n` +
        `**투표 결과**\n${optionsSummary}`;

    const noticeData: Prisma.NoticeCreateInput = {
        title: `[투표 결과] ${poll.title}`,
        content: noticeContent,
        category: NoticeCategory.RESIDENT_VOTE,
        author: { connect: { id: poll.authorId! } },
        apartmentboard: { connect: { id: poll.apartmentboardId } },
        startDate: new Date(),
        endDate: new Date(new Date().setDate(new Date().getDate() + 30)), // 30일 동안 게시
    };

    return await prismaClient.$transaction(async (tx) => {
        const createdNotice = await noticeRepository.createNotice(noticeData, tx);

        if (createdNotice.startDate && createdNotice.endDate) {
            await eventRepository.upsertEvent(
                {
                    boardType: 'NOTICE',
                    boardId: createdNotice.id,
                    startDate: createdNotice.startDate,
                    endDate: createdNotice.endDate,
                },
                tx,
            );
        }

        return createdNotice;
    });
};
