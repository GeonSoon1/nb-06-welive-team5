import * as notificationService from '../src/notifications/notification.service';
import * as notificationRepository from '../src/notifications/notification.repository';
import { CustomError } from '../src/libs/errors/errorHandler';

jest.mock('../src/notifications/notification.repository');

describe('Notification Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('markAsRead', () => {
        it('정상적으로 알림을 읽음 처리해야 한다', async () => {
            // Given
            const mockNotification = { id: 'noti-1', userId: 'user-1', isChecked: false, content: '알림내용' };
            (notificationRepository.findNotificationById as jest.Mock).mockResolvedValue(mockNotification);
            (notificationRepository.updateNotificationReadStatus as jest.Mock).mockResolvedValue({
                ...mockNotification,
                isChecked: true
            });

            // When
            const result = await notificationService.markAsRead('user-1', 'noti-1');

            // Then
            expect(notificationRepository.findNotificationById).toHaveBeenCalledWith('noti-1');
            expect(notificationRepository.updateNotificationReadStatus).toHaveBeenCalledWith('noti-1');
            expect(result.isChecked).toBe(true);
        });

        it('자신의 알림이 아니면 CustomError(403)를 던져야 한다', async () => {
            // Given
            const mockNotification = { id: 'noti-1', userId: 'other-user' };
            (notificationRepository.findNotificationById as jest.Mock).mockResolvedValue(mockNotification);

            // When & Then
            await expect(notificationService.markAsRead('user-1', 'noti-1')).rejects.toThrow(CustomError);
            await expect(notificationService.markAsRead('user-1', 'noti-1')).rejects.toMatchObject({ statusCode: 403 });
        });
    });
});