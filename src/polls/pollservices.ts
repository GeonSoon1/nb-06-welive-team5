import { Prisma, prismaClient } from '../libs/constants';
import { CustomError } from '../libs/errors/errorHandler';
import { CreatePollDto } from './pollstruct';


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

};

export const pollService = new PollService();