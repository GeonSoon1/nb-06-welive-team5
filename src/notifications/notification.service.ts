import { Response } from 'express';
import * as notificationRepository from './notification.repository';
import { CustomError } from '../libs/errors/errorHandler';
import { Notification, NotificationType } from '@prisma/client';

// 사용자별 SSE 연결을 저장하는 객체
const clients: { [userId: string]: Response; } = {};

/**
 * SSE 연결을 설정하고 초기 알림 전송 및 하트비트 로직을 수행합니다.
 */
export const streamNotifications = async (userId: string, res: Response) => {
    // 1. SSE 헤더 설정
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // 클라이언트 응답 객체 저장
    clients[userId] = res;
    console.log(`[SSE] Client connected: ${userId}`);

    // 연결 확인 메시지 전송
    const connectionPayload = {
        type: 'connection',
        data: 'SSE connection established',
    };
    res.write(`data: ${JSON.stringify(connectionPayload)}\n\n`);

    // 2. 초기 미발송(읽지 않은) 알림 전송 로직 추가
    try {
        const unreadNotifications = await notificationRepository.findUnreadNotificationsByUserId(userId);

        if (unreadNotifications.length > 0) {
            const payload = {
                type: 'alarm',
                data: unreadNotifications.map(n => ({
                    notificationId: n.id,
                    content: n.content,
                    notificationType: n.notificationType,
                    notifiedAt: n.createdAt,
                    isChecked: n.isChecked,
                    complaintId: n.complaintId,
                    noticeId: n.noticeId,
                    pollId: n.voteId, // DB의 voteId를 pollId로 매핑
                })),
            };
            res.write(`event: alarm\n`); // 추가
            res.write(`data: ${JSON.stringify(payload)}\n\n`);
            console.log(`[SSE] Sent ${unreadNotifications.length} unread notifications to user ${userId}`);
        }
    } catch (error) {
        console.error(`[SSE] Error fetching unread notifications for ${userId}:`, error);
    }

    // 3. 하트비트(Heartbeat) 로직 추가 (30초 주기)
    // 연결 유지를 위해 주기적으로 빈 주석 또는 데이터를 보냅니다.
    const heartbeatInterval = setInterval(() => {
        if (!res.writableEnded) {
            res.write(':\n\n'); // SSE 표준에 따른 주석 형식 하트비트
        }
    }, 30000);

    // 클라이언트 연결 종료 처리
    res.on('close', () => {
        console.log(`[SSE] Client disconnected: ${userId}`);
        clearInterval(heartbeatInterval); // 하트비트 타이머 해제
        delete clients[userId];
        res.end();
    });
};

/**
 * 새로운 알림 생성 시 SSE 연결이 있는 유저에게 실시간 전송합니다.
 */
export const sendNotificationToUser = async (data: {
    userId: string;
    content: string;
    notificationType: NotificationType;
    complaintId?: string;
    noticeId?: string;
    voteId?: string;
}): Promise<Notification> => {
    // 1. 데이터베이스에 알림 저장
    const newNotification = await notificationRepository.createNotification(data);

    // 2. 해당 유저가 SSE에 연결되어 있는지 확인
    const clientRes = clients[data.userId];

    if (clientRes) {
        // 3. 페이로드 준비 및 전송
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
                    pollId: newNotification.voteId,
                },
            ],
        };
        // 핵심: event: alarm 줄을 추가하여 프론트엔드의 addEventListener('alarm')을 트리거함
        clientRes.write(`event: alarm\n`);
        clientRes.write(`data: ${JSON.stringify(payload)}\n\n`);
        console.log(`[SSE] Sent real-time notification to user ${data.userId}`);
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