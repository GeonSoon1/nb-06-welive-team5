import { prismaClient } from '../libs/constants';
import { NotificationType } from '@prisma/client';

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

export const createNotification = async (data: {
  content: string;
  notificationType: NotificationType;
  userId: string;
  complaintId?: string;
  noticeId?: string;
  voteId?: string;
}) => {
  return prismaClient.notification.create({
    data,
  });
};
