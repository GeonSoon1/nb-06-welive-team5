import { assert, isUuid, superstruct } from '../libs/constants';
import type { ExpressHandler } from '../libs/constants';
import { CreateNoticeStruct, GetNoticeListQuery, UpdateNoticeStruct } from './notice.struct';
import { CustomError } from '../libs/errors/errorHandler';
import * as noticeService from './notice.service';

export const createNotice: ExpressHandler = async (req, res, next) => {
    try {
        assert(req.body, CreateNoticeStruct);
        const userId = req.user?.id;
        if (!userId) throw new CustomError(401, '로그인이 필요합니다.');

        await noticeService.createNotice(userId, req.body);
        res.status(201).json({ message: '정상적으로 등록 처리되었습니다' });
    } catch (error) {
        next(error);
    }
};

export const getNoticeList: ExpressHandler = async (req, res, next) => {
    try {
        const query = superstruct.create(req.query, GetNoticeListQuery);
        const result = await noticeService.getNoticeList(query);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const getNoticeDetail: ExpressHandler = async (req, res, next) => {
    try {

        const { noticeId } = req.params;
        if (typeof noticeId !== 'string' || !noticeId || !isUuid.v4(noticeId)) throw new CustomError(400, '잘못된 요청입니다. (noticeId)');

        const result = await noticeService.getNoticeDetail(noticeId);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const updateNotice: ExpressHandler = async (req, res, next) => {
    try {
        const { noticeId } = req.params;
        if (typeof noticeId !== 'string' || !noticeId || !isUuid.v4(noticeId)) throw new CustomError(400, '잘못된 요청입니다. (noticeId)');

        assert(req.body, UpdateNoticeStruct);
        const userId = req.user?.id;
        if (!userId) throw new CustomError(401, '로그인이 필요합니다.');

        const result = await noticeService.updateNotice(noticeId, userId, req.body);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const deleteNotice: ExpressHandler = async (req, res, next) => {
    try {
        const { noticeId } = req.params;
        if (typeof noticeId !== 'string' || !noticeId || !isUuid.v4(noticeId)) throw new CustomError(400, '잘못된 요청입니다. (noticeId)');

        const userId = req.user?.id;
        if (!userId) throw new CustomError(401, '로그인이 필요합니다.');

        await noticeService.deleteNotice(noticeId, userId);
        res.status(200).json({ message: '정상적으로 삭제 처리되었습니다' });
    } catch (error) {
        next(error);
    }
};