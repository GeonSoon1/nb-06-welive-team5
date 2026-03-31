import type { ExpressHandler } from '../libs/constants';
import { isUuid } from '../libs/constants';
import { CustomError } from '../libs/errors/errorHandler';
import * as notificationService from './notification.service';

export const subscribeNotifications: ExpressHandler = async (req, res) => {
    const userId = req.user!.id;
    await notificationService.streamNotifications(userId, res);

};

export const readNotification: ExpressHandler = async (req, res) => {

    const { notificationId } = req.params;

    if (typeof notificationId !== 'string' || !notificationId || !isUuid.v4(notificationId)) {
        throw new CustomError(400, '잘못된 요청입니다. (notificationId)');
    }

    const userId = req.user!.id;

    const result = await notificationService.markAsRead(userId, notificationId);
    res.status(200).json(result);

};