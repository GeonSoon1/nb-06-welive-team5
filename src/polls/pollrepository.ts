import { prismaClient, Prisma } from '../libs/constants';

class PollRepository {
    async createPoll(pollData: Prisma.VoteCreateInput) {
        return prismaClient.vote.create({
            data: pollData,
            include: {
                voteOptions: true,
            },
        });
    }

    async findPolls(skip: number, take: number, where: Prisma.VoteWhereInput) {
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
    }

    async findPollById(pollId: string) {
        return prismaClient.vote.findUnique({
            where: { id: pollId },
            include: {
                author: true,
                voteOptions: true,
            },
        });
    }

    async updatePoll(pollId: string, data: Prisma.VoteUpdateInput) {
        return prismaClient.vote.update({
            where: { id: pollId },
            data,
            include: {
                voteOptions: true,
            },
        });
    }

    async deletePoll(pollId: string) {
        return prismaClient.vote.delete({
            where: { id: pollId },
        });
    }
};

export const pollRepository = new PollRepository();