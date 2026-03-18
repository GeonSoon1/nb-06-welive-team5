import { prismaClient, Prisma } from '../libs/constants';

export const updatePollStatuses = async () => {
    const now = new Date();

    // 1. 종료 시간이 지난 투표를 CLOSED(마감)로 변경
    await prismaClient.vote.updateMany({
        where: {
            endTime: { lte: now },
            status: { not: 'CLOSED' },
        },
        data: { status: 'CLOSED' },
    });

    // 2. 시작 시간이 지났고 진행 전인 투표를 IN_PROGRESS(진행 중)로 변경
    await prismaClient.vote.updateMany({
        where: {
            startTime: { lte: now },
            endTime: { gt: now },
            status: 'PENDING',
        },
        data: { status: 'IN_PROGRESS' },
    });
};

export const createPoll = async (pollData: Prisma.VoteCreateInput) => {
    return prismaClient.vote.create({
        data: pollData,
        include: {
            voteOptions: true,
        },
    });
};

export const findPolls = async (skip: number, take: number, where: Prisma.VoteWhereInput) => {
    const [totalCount, polls] = await Promise.all([
        prismaClient.vote.count({ where }),
        prismaClient.vote.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: { name: true }
                },
            },
        }),
    ]);
    return { totalCount, polls };
};

export const findPollById = async (pollId: string) => {
    return prismaClient.vote.findUnique({
        where: { id: pollId },
        include: {
            author: {
                select: { name: true }
            },
            voteOptions: true,
        },
    });
};

export const updatePoll = async (pollId: string, data: Prisma.VoteUpdateInput) => {
    return prismaClient.vote.update({
        where: { id: pollId },
        data,
        include: {
            voteOptions: true,
        },
    });
};

export const deletePoll = async (pollId: string) => {
    return prismaClient.vote.delete({
        where: { id: pollId },
    });
};