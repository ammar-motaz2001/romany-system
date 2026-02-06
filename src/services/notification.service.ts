import { apiService } from './api.service';
import { API_ENDPOINTS } from '../config/api.config';

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type?: string;
  createdAt?: string;
}

export interface CreateNotificationData {
  title: string;
  message: string;
  type?: string;
}

class NotificationService {
  // Get all notifications
  async getAllNotifications(): Promise<Notification[]> {
    return apiService.get<Notification[]>(API_ENDPOINTS.NOTIFICATIONS.GET_ALL);
  }

  // Get unread count
  async getUnreadCount(): Promise<number> {
    const response = await apiService.get<{ count: number }>(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
    return response.count;
  }

  // Get notification by ID
  async getNotificationById(id: string): Promise<Notification> {
    return apiService.get<Notification>(API_ENDPOINTS.NOTIFICATIONS.GET_BY_ID(id));
  }

  // Create notification
  async createNotification(data: CreateNotificationData): Promise<Notification> {
    return apiService.post<Notification>(API_ENDPOINTS.NOTIFICATIONS.CREATE, data);
  }

  // Mark as read
  async markAsRead(id: string): Promise<Notification> {
    return apiService.patch<Notification>(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
  }

  // Mark all as read
  async markAllAsRead(): Promise<void> {
    return apiService.patch<void>(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
  }

  // Delete notification
  async deleteNotification(id: string): Promise<void> {
    return apiService.delete<void>(API_ENDPOINTS.NOTIFICATIONS.DELETE(id));
  }

  // Delete all read notifications
  async deleteAllRead(): Promise<void> {
    return apiService.delete<void>(API_ENDPOINTS.NOTIFICATIONS.DELETE_ALL_READ);
  }

  // Cleanup old notifications
  async cleanup(): Promise<void> {
    return apiService.post<void>(API_ENDPOINTS.NOTIFICATIONS.CLEANUP);
  }
}

export const notificationService = new NotificationService();
export default notificationService;
