import { Role } from '@prisma/client';
import { Prisma, prismaClient } from '../libs/constants';
import { CustomError } from '../libs/errors/errorHandler';
import { CreatePollDto, GetPollListDto, UpdatePollDto } from './poll.struct';
import * as pollRepository from './poll.repository';
import ForbiddenError from '../libs/errors/ForbiddenError';

/**
 * 투표 생성
 * @param userId 작성자 ID
 * @param pollData 컨트롤러에서 검증된 DTO
 */
export const createPoll = async (userId: string, pollData: CreatePollDto) => {
    const { options, boardId, buildingPermission, startDate, endDate, ...voteData } = pollData;

    const newPoll = await prismaClient.vote.create({
        data: {
            ...voteData,
            targetScope: buildingPermission,
            startTime: startDate,
            endTime: endDate,
            authorId: userId,
            apartmentboardId: boardId,
            voteOptions: {
                create: options.map((option) => ({
                    content: option.title,
                })),
            },
        },
        include: {
            voteOptions: true,
        },
    });
    return newPoll;

};

/**
 * 투표 목록 조회
 */
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
        polls: polls.map((poll) => {
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
            };
        }),
        totalCount,
    };
};

/**
 * 투표 상세 조회
 */
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

/**
 * 투표 수정 (권한 확인 포함)
 */
export const updatePoll = async (pollId: string, userId: string, userRole: Role, pollData: UpdatePollDto) => {
    const poll = await pollRepository.findPollById(pollId);
    if (!poll) throw new CustomError(404, '투표 글을 찾을 수 없습니다.');
    const isAdmin = userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN;
    const isOwner = poll.authorId === userId;
    if (!isOwner && !isAdmin) throw new ForbiddenError('자신이 작성한 투표만 수정할 수 있습니다.');

    const { options, buildingPermission, startDate, endDate, ...voteData } = pollData;

    const updateData: Prisma.VoteUpdateInput = { ...voteData };

    if (buildingPermission !== undefined) updateData.targetScope = buildingPermission;
    if (startDate) updateData.startTime = startDate;
    if (endDate) updateData.endTime = endDate;

    if (options) {
        // 기존 옵션의 ID 목록 추출
        const existingOptionIds = poll.voteOptions.map(opt => opt.id);
        // 클라이언트가 보낸 옵션 중 'id'가 포함되어 있는 목록
        const incomingOptionIds = options.map(opt => opt.id).filter(Boolean) as string[];
        // 기존에는 있었으나 이번 수정 요청 배열에 없는 것은 '삭제' 대상으로 간주
        const optionsToDelete = existingOptionIds.filter(id => !incomingOptionIds.includes(id));

        updateData.voteOptions = {
            // 1. 누락된 기존 옵션은 삭제 처리
            ...(optionsToDelete.length > 0 && { deleteMany: { id: { in: optionsToDelete } } }),

            // 2. id가 같이 넘어온 항목은 기존 데이터를 수정 (투표 수 유지)
            update: options.filter(opt => opt.id).map((opt) => ({
                where: { id: opt.id },
                data: { content: opt.title },
            })),

            // 3. id가 없는 항목은 새로운 옵션으로 생성
            create: options.filter(opt => !opt.id).map((opt) => ({
                content: opt.title,
            })),
        };
    }

    return await pollRepository.updatePoll(pollId, updateData);
};

/**
 * 투표 삭제 (권한 확인 포함)
 */
export const deletePoll = async (pollId: string, userId: string, userRole: Role) => {
    const poll = await pollRepository.findPollById(pollId);
    if (!poll) throw new CustomError(404, '투표 글을 찾을 수 없습니다.');

    // 권한 검사: 작성자 본인 혹은 관리자(ADMIN, SUPER_ADMIN) 확인
    const isAdmin = userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN;
    const isOwner = poll.authorId === userId;
    //작성자 본인이 아니더라도 관리자이면 삭제 가능하도록 조건 추가
    if (!isOwner) {
        if (!isAdmin) throw new ForbiddenError('자신이 작성한 투표만 삭제할 수 있습니다.');
    }

    await pollRepository.deletePoll(pollId);
};