import { Prisma, prismaClient } from '../libs/constants';
import { CustomError } from '../libs/errors/errorHandler';
import { CreatePollDto, GetPollListDto, UpdatePollDto } from './poll.struct';
import * as pollRepository from './poll-repository';


// Prisma의 유틸리티 타입을 사용하여 author가 포함된 Vote 타입을 명시적으로 정의
type PollWithAuthor = Prisma.VoteGetPayload<{
    include: { author: true; };
}>;

export const createPoll = async (pollData: CreatePollDto) => {
    const { options, boardId, buildingPermission, startDate, endDate, ...voteData } = pollData;

    const newPoll = await prismaClient.vote.create({
        data: {
            ...voteData,
            targetScope: buildingPermission,
            startTime: startDate,
            endTime: endDate,
            authorId: "testuseruuid",//테스트용 글 작성자의 uuid
            apartmentboardId: boardId,
            voteOptions: {
                create: options.map((option) => ({
                    content: option.title,
                })),
            },
        },
        include: {
            voteOptions: true, // 생성된 옵션 정보도 함께 반환
        },
    });
    return newPoll;

};

export const getPollList = async (query: GetPollListDto) => {
    const { page, limit, buildingPermission, status, keyword } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.VoteWhereInput = {};

    if (status) where.status = status;
    if (buildingPermission !== undefined) where.targetScope = buildingPermission;
    if (keyword) {
        where.OR = [{ title: { contains: keyword } }, { content: { contains: keyword } }];
    }

    const { totalCount, polls } = await pollRepository.findPolls(skip, limit, where);

    return {
        polls: polls.map((poll: PollWithAuthor) => {

            return {
                pollId: poll.id,
                userId: poll.authorId,
                title: poll.title,
                writerName: poll.author?.name || '알 수 없음', // any 제거 및 올바른 필드(name) 사용
                buildingPermission: poll.targetScope,
                createdAt: poll.createdAt,
                updatedAt: poll.updatedAt,
                startDate: poll.startTime,
                endDate: poll.endTime,
                status: poll.status,
            };
        }),
        totalCount,
    };
};

export const getPollById = async (pollId: string) => {
    const poll = await pollRepository.findPollById(pollId);

    if (!poll) throw new CustomError(404, '투표 글을 찾을 수 없습니다.');

    return {
        pollId: poll.id,
        userId: poll.authorId,
        title: poll.title,
        writerName: poll.author?.name || '알 수 없음',
        buildingPermission: poll.targetScope,
        createdAt: poll.createdAt,
        updatedAt: poll.updatedAt,
        startDate: poll.startTime,
        endDate: poll.endTime,
        status: poll.status,
        content: poll.content,
        boardName: poll.apartmentboardId,
        options: poll.voteOptions.map((option) => ({
            id: option.id,
            title: option.content,
            voteCount: option.voteCount,
        })),
    };
};

export const updatePoll = async (pollId: string, pollData: UpdatePollDto) => {
    const poll = await pollRepository.findPollById(pollId);
    if (!poll) throw new CustomError(404, '투표 글을 찾을 수 없습니다.');

    const { options, buildingPermission, startDate, endDate, ...voteData } = pollData;

    const updateData: Prisma.VoteUpdateInput = { ...voteData };

    if (buildingPermission !== undefined) updateData.targetScope = buildingPermission;
    if (startDate) updateData.startTime = startDate;
    if (endDate) updateData.endTime = endDate;

    if (options) {
        updateData.voteOptions = {
            deleteMany: {},
            create: options.map((option) => ({
                content: option.title,
            })),
        };
    }

    return await pollRepository.updatePoll(pollId, updateData);
};

export const deletePoll = async (pollId: string) => {
    const poll = await pollRepository.findPollById(pollId);
    if (!poll) throw new CustomError(404, '투표 글을 찾을 수 없습니다.');

    await pollRepository.deletePoll(pollId);
};