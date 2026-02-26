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


};

export const pollRepository = new PollRepository();