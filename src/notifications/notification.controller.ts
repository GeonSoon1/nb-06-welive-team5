import type { ExpressHandler } from '../libs/constants';
import { isUuid } from '../libs/constants';
import { CustomError } from '../libs/errors/errorHandler';
import * as notificationService from './notification.service';

export const subscribeNotifications: ExpressHandler = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) throw new CustomError(401, '로그인이 필요합니다.');

        notificationService.streamNotifications(userId, res);
    } catch (error) {
        next(error);
    }
};

export const readNotification: ExpressHandler = async (req, res, next) => {
    try {
        const { notificationId } = req.params;

        if (typeof notificationId !== 'string' || !notificationId || !isUuid.v4(notificationId)) {
            throw new CustomError(400, '잘못된 요청입니다. (notificationId)');
        }

        const userId = req.user?.id;
        if (!userId) throw new CustomError(401, '로그인이 필요합니다.');

        const result = await notificationService.markAsRead(userId, notificationId);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};