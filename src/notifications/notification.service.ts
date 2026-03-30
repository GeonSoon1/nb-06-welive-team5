import { Response } from 'express';
import * as notificationRepository from './notification.repository';
import { CustomError } from '../libs/errors/errorHandler';
import { Notification, NotificationType } from '@prisma/client';

// Map to store active SSE clients, mapping userId to their Response object
const clients: { [userId: string]: Response; } = {};

export const streamNotifications = (userId: string, res: Response) => {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Store the client's response object
    clients[userId] = res;
    console.log(`[SSE] Client connected: ${userId}`);

    // Send a connection confirmation message
    const payload = {
        type: 'connection',
        data: 'SSE connection established',
    };
    res.write(`data: ${JSON.stringify(payload)}\n\n`);

    // Handle client disconnection
    res.on('close', () => {
        console.log(`[SSE] Client disconnected: ${userId}`);
        delete clients[userId];
        res.end();
    });
};

/**
 * Creates a notification and sends it to the user if they are connected via SSE.
 */
export const sendNotificationToUser = async (data: {
    userId: string;
    content: string;
    notificationType: NotificationType;
    complaintId?: string;
    noticeId?: string;
    voteId?: string;
}): Promise<Notification> => {
    // 1. Save notification to the database
    const newNotification = await notificationRepository.createNotification(data);

    // 2. Check if the user is connected via SSE
    const clientRes = clients[data.userId];

    if (clientRes) {
        // 3. Prepare the payload in the desired format
        const payload = {
            type: 'alarm',
            data: [
                {
                    notificationId: newNotification.id,
                    content: newNotification.content,
                    notificationType: newNotification.notificationType,
                    notifiedAt: newNotification.createdAt,
                    isChecked: newNotification.isChecked,
                    complaintId: newNotification.complaintId,
                    noticeId: newNotification.noticeId,
                    pollId: newNotification.voteId, // Map DB's voteId to pollId
                },
            ],
        };

        // 4. Send the notification to the specific user
        clientRes.write(`data: ${JSON.stringify(payload)}\n\n`);
        console.log(`[SSE] Sent notification to user ${data.userId}`);
    } else {
        console.log(`[SSE] User ${data.userId} not connected. Notification saved to DB.`);
    }

    return newNotification;
};

export const markAsRead = async (userId: string, notificationId: string) => {
    const notification = await notificationRepository.findNotificationById(notificationId);

    if (!notification) {
        throw new CustomError(404, '알림을 찾을 수 없습니다.');
    }

    if (notification.userId !== userId) {
        throw new CustomError(403, '권한이 없습니다.');
    }

    const updated = await notificationRepository.updateNotificationReadStatus(notificationId);

    return {
        notificationId: updated.id,
        content: updated.content,
        notificationType: updated.notificationType,
        notifiedAt: updated.createdAt,
        isChecked: updated.isChecked,
        complaintId: updated.complaintId,
        noticeId: updated.noticeId,
        pollId: updated.voteId,
    };
};