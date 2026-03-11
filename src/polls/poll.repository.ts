import { prismaClient, Prisma } from '../libs/constants';

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
                author: true,
            },
        }),
    ]);
    return { totalCount, polls };
};

export const findPollById = async (pollId: string) => {
    return prismaClient.vote.findUnique({
        where: { id: pollId },
        include: {
            author: true,
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