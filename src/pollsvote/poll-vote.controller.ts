import { isUuid } from '../libs/constants';
import type { ExpressRequest, ExpressResponse, ExpressNextFunction, ExpressHandler } from '../libs/constants';
import { CustomError } from '../libs/errors/errorHandler';
import * as pollsVoteService from './poll-vote.service.js';
import { RequestWithUser } from './poll-vote.struct';

export const addVote: ExpressHandler = async (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
    try {
        const { optionId } = req.params;
        const userId = (req as RequestWithUser).user?.userId;
        if (!userId) {
            throw new CustomError(401, '로그인이 필요합니다.');
        }
        if (typeof optionId !== 'string' || !isUuid.v4(optionId)) {
            throw new CustomError(400, '잘못된 요청입니다. (optionId)');
        }

        const result = await pollsVoteService.addVote(optionId, userId);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const cancelVote: ExpressHandler = async (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
    try {
        const { optionId } = req.params;
        const userId = (req as RequestWithUser).user?.userId;
        if (!userId) {
            throw new CustomError(401, '로그인이 필요합니다.');
        }
        if (typeof optionId !== 'string' || !isUuid.v4(optionId)) {
            throw new CustomError(400, '잘못된 요청입니다. (optionId)');
        }

        const result = await pollsVoteService.cancelVote(optionId, userId);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};
