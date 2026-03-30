import { prismaClient, Prisma } from '../libs/constants';

export const createNotice = async (data: Prisma.NoticeCreateInput) => {
    return prismaClient.notice.create({
        data,
    });
};

export const findNotices = async (skip: number, take: number, where: Prisma.NoticeWhereInput) => {
    const [totalCount, notices] = await Promise.all([
        prismaClient.notice.count({ where }),
        prismaClient.notice.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: { id: true, name: true }
                },
                _count: {
                    select: { comments: true }
                }
            },
        }),
    ]);
    return { totalCount, notices };
};

export const findNoticeById = async (noticeId: string) => {
    return prismaClient.notice.findUnique({
        where: { id: noticeId },
        include: {
            author: {
                select: { id: true, name: true }
            },
            comments: {
                include: {
                    author: {
                        select: { id: true, name: true }
                    }
                },
                orderBy: { createdAt: 'asc' }
            },
            _count: {
                select: { comments: true }
            }
        },
    });
};

export const updateNotice = async (noticeId: string, data: Prisma.NoticeUpdateInput) => {
    return prismaClient.notice.update({
        where: { id: noticeId },
        data,
    });
};

export const deleteNotice = async (noticeId: string) => {
    return prismaClient.notice.delete({
        where: { id: noticeId },
    });
};

export const incrementViewCount = async (noticeId: string) => {
    return prismaClient.notice.update({
        where: { id: noticeId },
        data: {
            viewCount: { increment: 1 }
        }
    });
};