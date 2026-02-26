import { Prisma, prismaClient } from '../libs/constants';
import { CustomError } from '../libs/errors/errorHandler';
import { CreatePollDto, GetPollListDto } from './pollstruct';
import { pollRepository } from './pollrepository';


class PollService {
    async createPoll(pollData: CreatePollDto) {
        try {
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
        } catch (error) {
            throw new CustomError(500, '투표 생성 중 오류가 발생했습니다.');
        }
    }

    async getPollList(query: GetPollListDto) {
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
                const date = new Date(poll.createdAt);
                const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

                return {
                    pollId: poll.id,
                    userId: poll.authorId,
                    title: poll.title,
                    writerName: (poll.author as any)?.nickname || '알 수 없음',
                    buildingPermission: poll.targetScope,
                    createdAt: formattedDate,
                    updatedAt: poll.updatedAt,
                    startDate: poll.startTime,
                    endDate: poll.endTime,
                    status: poll.status,
                };
            }),
            totalCount,
        };
    }
};

export const pollService = new PollService();