import { prismaClient } from '../libs/constants';

class PollsVoteRepository {
    async findOptionWithVote(optionId: string) {
        return prismaClient.voteOption.findUnique({
            where: { id: optionId },
            include: { vote: true },
        });
    }

    async findPollByOptionId(optionId: string) {
        const option = await prismaClient.voteOption.findUnique({
            where: { id: optionId },
            select: { vote: true },
        });
        return option?.vote;
    }

    async findUserVote(userId: string, pollId: string) {
        return prismaClient.voteRecord.findUnique({
            where: {
                userId_voteId: {
                    userId,
                    voteId: pollId,
                },
            },
        });
    }

    async findUserVoteByOption(userId: string, optionId: string) {
        return prismaClient.voteRecord.findFirst({
            where: {
                userId,
                voteOptionId: optionId,
            },
        });
    }

    async findOptionsByPollId(pollId: string) {
        return prismaClient.voteOption.findMany({
            where: { voteId: pollId }
        });
    }

    async createVoteAndUpdateCount(optionId: string, userId: string, pollId: string, apartmentboardId: string) {
        const [, updatedOption] = await prismaClient.$transaction([
            prismaClient.voteRecord.create({
                data: {
                    userId,
                    voteId: pollId,
                    voteOptionId: optionId,
                    apartmentboardId,
                },
            }),
            prismaClient.voteOption.update({
                where: { id: optionId },
                data: { voteCount: { increment: 1 } },
            }),
        ]);
        return updatedOption;
    }

    async deleteVoteAndUpdateCount(userVoteId: string, optionId: string) {
        const [, updatedOption] = await prismaClient.$transaction([
            prismaClient.voteRecord.delete({
                where: { id: userVoteId },
            }),
            prismaClient.voteOption.update({
                where: { id: optionId },
                data: { voteCount: { decrement: 1 } },
            }),
        ]);
        return updatedOption;
    }
}

export const pollsVoteRepository = new PollsVoteRepository();
