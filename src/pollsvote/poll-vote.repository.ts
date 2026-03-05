import { prismaClient } from '../libs/constants';

export const findOptionWithVote = async (optionId: string) => {
    return prismaClient.voteOption.findUnique({
        where: { id: optionId },
        include: { vote: true },
    });
};

export const findPollByOptionId = async (optionId: string) => {
    const option = await prismaClient.voteOption.findUnique({
        where: { id: optionId },
        select: { vote: true },
    });
    return option?.vote;
};

export const findUserVote = async (userId: string, pollId: string) => {
    return prismaClient.voteRecord.findUnique({
        where: {
            userId_voteId: {
                userId,
                voteId: pollId,
            },
        },
    });
};

export const findUserVoteByOption = async (userId: string, optionId: string) => {
    return prismaClient.voteRecord.findFirst({
        where: {
            userId,
            voteOptionId: optionId,
        },
    });
};

export const findOptionsByPollId = async (pollId: string) => {
    return prismaClient.voteOption.findMany({
        where: { voteId: pollId }
    });
};

export const createVoteAndUpdateCount = async (optionId: string, userId: string, pollId: string, apartmentboardId: string) => {
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
};

export const deleteVoteAndUpdateCount = async (userVoteId: string, optionId: string) => {
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
};
