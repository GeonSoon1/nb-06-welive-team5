import type { ExpressHandler } from '../libs/constants';
import { isUuid } from '../libs/constants';
import { CustomError } from '../libs/errors/errorHandler';
import * as notificationService from './notification.service';

export const subscribeNotifications: ExpressHandler = async (req, res, next) => {
    try {
        //! 를 통해 미들웨어가 사용자 정보를 주입하였음을 명시
        const userId = req.user!.id;

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

        const userId = req.user!.id;

        const result = await notificationService.markAsRead(userId, notificationId);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};