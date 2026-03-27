import { assert, isUuid, superstruct } from '../libs/constants';
import type { ExpressRequest, ExpressResponse, ExpressHandler, ExpressNextFunction } from '../libs/constants';
import { CreatePollStruct, GetPollListQuery, UpdatePollStruct } from './poll.struct';
import { CustomError } from '../libs/errors/errorHandler';
import * as pollService from './poll.services';

export const CreatePolls: ExpressHandler = async (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
    try {
        const validatedBody = superstruct.create(req.body, CreatePollStruct);

        const { id: userId, apartmentId } = req.user!;

        const newPoll = await pollService.createPoll(userId, apartmentId, validatedBody);

        res.status(201).json({ success: true, message: '투표가 성공적으로 생성되었습니다.', data: newPoll });
    } catch (error) {
        next(error);
    }
};

export const GetAllPollList: ExpressHandler = async (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
    try {
        const query = superstruct.create(req.query, GetPollListQuery);
        const { apartmentId, role } = req.user!;

        const result = await pollService.getPollList(query, apartmentId, role);

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const GetPollInformation: ExpressHandler = async (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
    try {
        const pollId = req.params.pollId;
        if (!pollId) throw new CustomError(400, "잘못된 요청입니다.(pollid 값 없음)");
        if (typeof pollId !== "string") throw new CustomError(400, "잘못된 요청입니다.(pollid 값이 문자열이 아님)");
        if (!isUuid.v4(pollId)) throw new CustomError(400, "잘못된 요청입니다.(잘못된 pollid 값)");

        const { apartmentId, role } = req.user!;
        const result = await pollService.getPollById(pollId, apartmentId, role);

        res.status(200).json(result);

    }
    catch (error) {
        next(error);
    }
};

export const UpdatePoll: ExpressHandler = async (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
    try {
        const pollId = req.params.pollId;
        if (typeof pollId !== 'string' || !isUuid.v4(pollId)) throw new CustomError(400, "잘못된 요청입니다.(pollId)");

        const { boardId, ...bodyWithoutUserId } = req.body;

        const validatedBody = superstruct.create(bodyWithoutUserId, UpdatePollStruct);



        const { id: userId, apartmentId, role } = req.user!;
        const updatedPoll = await pollService.updatePoll(pollId, userId, role, apartmentId, validatedBody);
        res.status(200).json({ success: true, message: '투표가 수정되었습니다.', data: updatedPoll });
    } catch (error) {
        next(error);
    }
};



export const DeletePoll: ExpressHandler = async (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
    try {
        const pollId = req.params.pollId;
        if (typeof pollId !== 'string' || !isUuid.v4(pollId)) throw new CustomError(400, "잘못된 요청입니다.(pollId)");

        const { id: userId, apartmentId, role } = req.user!;
        await pollService.deletePoll(pollId, userId, role, apartmentId);
        res.status(200).json({ success: true, message: '투표가 삭제되었습니다.' });
    } catch (error) {
        next(error);
    }
};