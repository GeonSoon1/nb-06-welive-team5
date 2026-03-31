import { Role, VoteStatus } from '@prisma/client';
import { Prisma, prismaClient } from '../libs/constants';
import { CustomError } from '../libs/errors/errorHandler';
import { CreatePollDto, GetPollListDto, UpdatePollDto } from './poll.struct';
import * as pollRepository from './poll.repository';
import ForbiddenError from '../libs/errors/ForbiddenError';
import BadRequestError from '../libs/errors/BadRequestError';
import * as noticeService from '../notices/notice.service';

/**
 * 투표 생성
 * @param userId 작성자 ID
 * @param pollData 컨트롤러에서 검증된 DTO
 */
export const createPoll = async (userId: string, apartmentId: string | null, pollData: CreatePollDto) => {
    const { options, boardId, buildingPermission, startDate, endDate, ...voteData } = pollData;

    if (new Date(endDate) < new Date()) {
        throw new BadRequestError('투표 종료 기간을 확인해 주세요.');
    }

    if (!apartmentId) throw new ForbiddenError('소속된 아파트 정보가 없습니다.');

    const apartment = await prismaClient.apartment.findFirst({
        where: {
            id: apartmentId
        }
    });

    if (!apartment) throw new ForbiddenError('유효하지 않은 게시판입니다.');

    let status: VoteStatus = VoteStatus.PENDING;
    if (new Date(startDate) < new Date()) {
        status = VoteStatus.IN_PROGRESS;
    }


    const newPoll = await prismaClient.vote.create({
        data: {
            ...voteData,
            targetScope: buildingPermission,
            startDate: startDate,
            endDate: endDate,
            authorId: userId,
            apartmentboardId: apartment.apartmentboardId,
            status,
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
export const getPollList = async (query: GetPollListDto, apartmentId: string | null, role: Role) => {
    const { page, limit, buildingPermission, status, keyword } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.VoteWhereInput = {};

    // SUPER_ADMIN이 아닌 경우, 자신이 속한 아파트의 투표만 조회하도록 필터링
    if (role !== Role.SUPER_ADMIN) {
        if (!apartmentId) throw new ForbiddenError('소속된 아파트 정보가 없습니다.');
        where.apartmentboard = {
            apartment: { id: apartmentId }
        };
    }

    if (status) where.status = status;
    if (buildingPermission !== undefined) where.targetScope = buildingPermission;
    if (keyword) {
        where.OR = [{ title: { contains: keyword } }, { content: { contains: keyword } }];
    }

    //-todo cron 정상화시 해당 투표 목록 최신화 및 공지사항으로 이동 삭제 필요
    const closedPolls = await pollRepository.updatePollStatuses();

    if (closedPolls && closedPolls.length > 0) {
        console.log(`[CRON_INFO] ${closedPolls.length}개 작업 처리 시작`);

        const results = await Promise.allSettled(
            closedPolls.map(poll => noticeService.createNoticeFromPoll(poll))
        );

        results.forEach((res, idx) => {
            if (res.status === 'rejected') {
                console.error(`[CRON_ERROR] ${idx}번째 공지 생성 실패:`, res.reason);
            }
        });
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
                startDate: poll.startDate,
                endDate: poll.endDate,
                status: poll.status,
            };
        }),
        totalCount,
    };
};

/**
 * 투표 상세 조회
 */
export const getPollById = async (pollId: string, apartmentId: string | null, role: Role) => {
    const poll = await pollRepository.findPollById(pollId);

    if (!poll) throw new CustomError(404, '투표 글을 찾을 수 없습니다.');

    // SUPER_ADMIN이 아닌 경우, 해당 투표가 자신의 아파트 소속인지 확인
    if (role !== Role.SUPER_ADMIN) {
        if (!apartmentId) throw new ForbiddenError('소속된 아파트 정보가 없습니다.');
        const accessCheck = await prismaClient.vote.findFirst({
            where: {
                id: pollId,
                apartmentboard: { apartment: { id: apartmentId } }
            }
        });
        if (!accessCheck) throw new ForbiddenError('해당 투표에 접근 권한이 없습니다.');
    }

    return {
        pollId: poll.id,
        userId: poll.authorId,
        title: poll.title,
        writerName: poll.author?.name || '알 수 없음',
        buildingPermission: poll.targetScope,
        createdAt: poll.createdAt,
        updatedAt: poll.updatedAt,
        startDate: poll.startDate,
        endDate: poll.endDate,
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
export const updatePoll = async (pollId: string, userId: string, userRole: Role, apartmentId: string | null, pollData: UpdatePollDto) => {
    const poll = await pollRepository.findPollById(pollId);
    if (!poll) throw new CustomError(404, '투표 글을 찾을 수 없습니다.');
    const isAdmin = userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN;
    const isOwner = poll.authorId === userId;
    if (!isOwner && !isAdmin) throw new ForbiddenError('자신이 작성한 투표만 수정할 수 있습니다.');

    // ADMIN 권한이더라도 자신이 관리하는 아파트의 투표만 수정 가능하도록 제한
    if (!isOwner && userRole === Role.ADMIN) {
        if (!apartmentId) throw new ForbiddenError('소속된 아파트 정보가 없습니다.');
        const accessCheck = await prismaClient.vote.findFirst({
            where: { id: pollId, apartmentboard: { apartment: { id: apartmentId } } }
        });
        if (!accessCheck) throw new ForbiddenError('자신이 관리하는 아파트의 투표만 수정할 수 있습니다.');
    }

    const { options, buildingPermission, startDate, endDate, ...voteData } = pollData;

    const updateData: Prisma.VoteUpdateInput = { ...voteData };

    if (buildingPermission !== undefined) updateData.targetScope = buildingPermission;
    if (startDate) updateData.startDate = startDate;
    if (endDate) updateData.endDate = endDate;

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
export const deletePoll = async (pollId: string, userId: string, userRole: Role, apartmentId: string | null) => {
    const poll = await pollRepository.findPollById(pollId);
    if (!poll) throw new CustomError(404, '투표 글을 찾을 수 없습니다.');

    // 권한 검사: 작성자 본인 혹은 관리자(ADMIN, SUPER_ADMIN) 확인
    const isAdmin = userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN;
    const isOwner = poll.authorId === userId;
    //작성자 본인이 아니더라도 관리자이면 삭제 가능하도록 조건 추가
    if (!isOwner) {
        if (!isAdmin) throw new ForbiddenError('자신이 작성한 투표만 삭제할 수 있습니다.');

        // ADMIN 권한이더라도 자신이 관리하는 아파트의 투표만 삭제 가능하도록 제한
        if (userRole === Role.ADMIN) {
            if (!apartmentId) throw new ForbiddenError('소속된 아파트 정보가 없습니다.');
            const accessCheck = await prismaClient.vote.findFirst({
                where: { id: pollId, apartmentboard: { apartment: { id: apartmentId } } }
            });
            if (!accessCheck) throw new ForbiddenError('자신이 관리하는 아파트의 투표만 삭제할 수 있습니다.');
        }
    }

    await pollRepository.deletePoll(pollId);
};