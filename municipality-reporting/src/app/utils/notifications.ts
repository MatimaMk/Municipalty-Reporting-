// utils/notifications.ts

export interface Notification {
  id: string;
  userId: string;
  type: "status_update" | "comment" | "assignment" | "resolved" | "rejected";
  title: string;
  message: string;
  issueId: string;
  isRead: boolean;
  createdAt: string;
}

const NOTIFICATIONS_KEY = "municipality_notifications";

export const notificationUtils = {
  // Get all notifications for a user
  getUserNotifications(userId: string): Notification[] {
    if (typeof window === "undefined") return [];
    const notifications = JSON.parse(
      localStorage.getItem(NOTIFICATIONS_KEY) || "[]"
    ) as Notification[];
    return notifications.filter((n) => n.userId === userId);
  },

  // Get unread count
  getUnreadCount(userId: string): number {
    return this.getUserNotifications(userId).filter((n) => !n.isRead).length;
  },

  // Mark notification as read
  markAsRead(notificationId: string): void {
    if (typeof window === "undefined") return;
    const notifications = JSON.parse(
      localStorage.getItem(NOTIFICATIONS_KEY) || "[]"
    ) as Notification[];
    const updated = notifications.map((n) =>
      n.id === notificationId ? { ...n, isRead: true } : n
    );
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
  },

  // Mark all as read
  markAllAsRead(userId: string): void {
    if (typeof window === "undefined") return;
    const notifications = JSON.parse(
      localStorage.getItem(NOTIFICATIONS_KEY) || "[]"
    ) as Notification[];
    const updated = notifications.map((n) =>
      n.userId === userId ? { ...n, isRead: true } : n
    );
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
  },

  // Create notification
  createNotification(
    userId: string,
    type: Notification["type"],
    title: string,
    message: string,
    issueId: string
  ): void {
    if (typeof window === "undefined") return;
    const notifications = JSON.parse(
      localStorage.getItem(NOTIFICATIONS_KEY) || "[]"
    ) as Notification[];

    const newNotification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type,
      title,
      message,
      issueId,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    notifications.unshift(newNotification);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));

    // Browser notification if supported
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body: message,
        icon: "/images/limpopo_province_government.jpg",
      });
    }
  },

  // Delete notification
  deleteNotification(notificationId: string): void {
    if (typeof window === "undefined") return;
    const notifications = JSON.parse(
      localStorage.getItem(NOTIFICATIONS_KEY) || "[]"
    ) as Notification[];
    const updated = notifications.filter((n) => n.id !== notificationId);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
  },

  // Request browser notification permission
  requestPermission(): void {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  },
};
