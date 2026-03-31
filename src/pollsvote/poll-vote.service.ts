import { CustomError } from '../libs/errors/errorHandler';
import * as pollsVoteRepository from './poll-vote.repository';

export const addVote = async (optionId: string, userId: string) => {
    const option = await pollsVoteRepository.findOptionWithVote(optionId);
    if (!option) {
        throw new CustomError(404, '존재하지 않는 선택지입니다.');
    }

    const poll = option.vote;
    const pollId = poll.id;
    const apartmentboardId = poll.apartmentboardId;

    if (poll.endDate < new Date()) {
        throw new CustomError(400, '투표 기간이 종료되었습니다.');
    }

    if (poll.status !== 'IN_PROGRESS') {
        throw new CustomError(400, '투표가 진행중인 상태가 아닙니다.');
    }

    const existingVote = await pollsVoteRepository.findUserVote(userId, pollId);
    if (existingVote) {
        throw new CustomError(409, '이미 해당 투표에 참여했습니다. 투표를 변경하려면 기존 투표를 취소하고 다시 시도해주세요.');
    }

    const updatedOption = await pollsVoteRepository.createVoteAndUpdateCount(optionId, userId, pollId, apartmentboardId);

    const allOptions = await pollsVoteRepository.findOptionsByPollId(pollId);

    let winnerOption = null;
    if (allOptions.length > 0) {
        winnerOption = allOptions.reduce((prev, current) => (prev.voteCount >= current.voteCount ? prev : current));
    }

    return {
        message: '투표가 성공적으로 완료되었습니다.',
        updatedOption: {
            id: updatedOption.id,
            title: updatedOption.content,
            votes: updatedOption.voteCount,
        },
        winnerOption: winnerOption
            ? {
                id: winnerOption.id,
                title: winnerOption.content,
                votes: winnerOption.voteCount,
            }
            : null,
        options: allOptions.map((opt) => ({
            id: opt.id,
            title: opt.content,
            votes: opt.voteCount,
        })),
    };
};

export const cancelVote = async (optionId: string, userId: string) => {
    const poll = await pollsVoteRepository.findPollByOptionId(optionId);
    if (!poll) {
        throw new CustomError(404, '관련 투표를 찾을 수 없습니다.');
    }
    if (poll.status !== 'IN_PROGRESS') {
        throw new CustomError(400, '투표가 진행중인 상태가 아니므로 취소할 수 없습니다.');
    }

    const userVote = await pollsVoteRepository.findUserVoteByOption(userId, optionId);
    if (!userVote) {
        throw new CustomError(404, '해당 선택지에 대한 투표 내역을 찾을 수 없습니다.');
    }

    const updatedOption = await pollsVoteRepository.deleteVoteAndUpdateCount(userVote.id, optionId);

    return {
        message: '투표가 성공적으로 취소되었습니다.',
        updatedOption: {
            id: updatedOption.id,
            title: updatedOption.content,
            votes: updatedOption.voteCount,
        },
    };
};
