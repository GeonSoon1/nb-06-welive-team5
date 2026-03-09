import { prismaClient } from '../libs/constants';

export const findUnreadNotificationsByUserId = async (userId: string) => {
    return prismaClient.notification.findMany({
        where: {
            userId,
            isChecked: false,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
};

export const findNotificationById = async (notificationId: string) => {
    return prismaClient.notification.findUnique({
        where: { id: notificationId },
    });
};

export const updateNotificationReadStatus = async (notificationId: string) => {
    return prismaClient.notification.update({
        where: { id: notificationId },
        data: { isChecked: true },
    });
};