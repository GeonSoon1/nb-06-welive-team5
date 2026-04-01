import { VoteStatus, Vote, VoteOption } from '@prisma/client';
import { prismaClient, Prisma } from '../libs/constants';

type ClosedPollWithOptions = Vote & { voteOptions: VoteOption[] };

export const updatePollStatuses = async (): Promise<ClosedPollWithOptions[]> => {
    const now = new Date();

    // 1. 종료 시간이 지난 투표를 찾아라 (옵션 정보 포함)
    const pollsToClose = await prismaClient.vote.findMany({
        where: {
            endTime: { lte: now },
            status: { not: VoteStatus.CLOSED },
        },
        include: {
            voteOptions: true,
        },
    });

    if (pollsToClose.length > 0) {
        const pollIdsToClose = pollsToClose.map((poll) => poll.id);

        // 해당 투표들의 상태를 'CLOSED'로 변경
        await prismaClient.vote.updateMany({
            where: {
                id: { in: pollIdsToClose },
            },
            data: { status: VoteStatus.CLOSED },
        });
    }

    // 2. 시작 시간이 지났고 진행 전인 투표를 IN_PROGRESS(진행 중)로 변경
    await prismaClient.vote.updateMany({
        where: {
            startTime: { lte: now },
            endTime: { gt: now },
            status: VoteStatus.PENDING,
        },
        data: { status: VoteStatus.IN_PROGRESS },
    });

    return pollsToClose; // 방금 마감 처리된 투표 목록을 반환
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
