import { assert } from './../libs/constants';
import type { ExpressRequest, ExpressResponse, ExpressNextFunction, ExpressHandler } from '../libs/constants';
import { CreatePollStruct } from './pollstruct';

export default class PollController {
    CreatePolls: ExpressHandler = (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
        assert(req.body, CreatePollStruct);

        // TODO: 데이터베이스에 투표를 생성하는 로직을 구현해야 합니다.
        res.status(201).json({ success: true, message: '투표가 성공적으로 생성되었습니다.' });
    };
};
