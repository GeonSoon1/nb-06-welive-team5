import { Response } from 'express';
import * as notificationRepository from './notification.repository';
import { CustomError } from '../libs/errors/errorHandler';

export const streamNotifications = (userId: string, res: Response) => {
    // SSE Header 설정
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sendNotifications = async () => {
        try {
            const notifications = await notificationRepository.findUnreadNotificationsByUserId(userId);

            // API 명세에 맞게 데이터 매핑
            const data = notifications.map(n => ({
                notificationId: n.id,
                content: n.content,
                notificationType: n.notificationType,
                notifiedAt: n.createdAt,
                isChecked: n.isChecked,
                complaintId: n.complaintId,
                noticeId: n.noticeId,
                pollId: n.voteId, // DB의 voteId를 API 명세의 pollId로 매핑
            }));

            const payload = {
                type: 'alarm',
                data: data
            };

            // SSE 포맷으로 데이터 전송
            res.write(`data: ${JSON.stringify(payload)}\n\n`);
        } catch (error) {
            console.error('SSE Error:', error);
            // 에러 발생 시 연결 종료 및 인터벌 해제
            clearInterval(intervalId);
            res.end();
        }
    };

    // 최초 연결 시 즉시 전송
    sendNotifications();

    // 30초마다 알림 전송
    const intervalId = setInterval(sendNotifications, 30000);

    // 클라이언트 연결 종료 시 인터벌 해제
    res.on('close', () => {
        clearInterval(intervalId);
        res.end();
    });
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
        pollId: updated.voteId
    };
};