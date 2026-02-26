import { assert, superstruct } from './../libs/constants';
import type { ExpressRequest, ExpressResponse, ExpressHandler, ExpressNextFunction } from '../libs/constants';
import { CreatePollStruct, GetPollListQuery } from './pollstruct';
import { CustomError } from '../libs/errors/errorHandler';
import { pollService } from './pollservices';

class PollController {
    CreatePolls: ExpressHandler = async (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
        try {
            assert(req.body, CreatePollStruct);

            // if (!req.user) throw new CustomError(401, '로그인이 필요합니다.');

            // const newPoll = await pollService.createPoll(req.body, String(req.user.userId));
            const newPoll = await pollService.createPoll(req.body);
            res.status(201).json({ success: true, message: '투표가 성공적으로 생성되었습니다.', data: newPoll });
        } catch (error) {
            next(error);
        }
    };

    GetAllPollList: ExpressHandler = async (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
        try {
            const query = superstruct.create(req.query, GetPollListQuery);
            const result = await pollService.getPollList(query);

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

};


export const pollController = new PollController();