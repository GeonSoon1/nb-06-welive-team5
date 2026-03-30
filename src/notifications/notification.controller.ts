import type { ExpressHandler } from '../libs/constants';
import { isUuid } from '../libs/constants';
import { CustomError } from '../libs/errors/errorHandler';
import * as notificationService from './notification.service';

export const subscribeNotifications: ExpressHandler = async (req, res, next) => {
    try {
        const userId = req.user!.id;
        // 서비스가 async이므로 await를 붙여 비동기 에러를 catchAsync가 잡을 수 있게 합니다.
        await notificationService.streamNotifications(userId, res);
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

        const userId = req.user!.id;

        const result = await notificationService.markAsRead(userId, notificationId);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};