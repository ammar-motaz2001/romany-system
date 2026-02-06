import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'appointment-reminder' | 'appointment-staff' | 'general';
  message: string;
  appointmentId?: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
  unreadCount: number;
  checkUpcomingAppointments: (appointments: any[]) => void;
  checkOpenShifts: (shifts: any[]) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifiedAppointments, setNotifiedAppointments] = useState<Set<string>>(new Set());
  const [notifiedShifts, setNotifiedShifts] = useState<Set<string>>(new Set());

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Show toast notification - use setTimeout to ensure Toaster is mounted
    setTimeout(() => {
      try {
        toast.success(notification.message, {
          duration: 5000,
          position: 'top-right',
        });
      } catch (error) {
        console.warn('Toast notification skipped - Toaster not ready');
      }
    }, 100);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notif => (notif.id === id ? { ...notif, read: true } : notif))
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const checkUpcomingAppointments = useCallback((appointments: any[]) => {
    if (!appointments || appointments.length === 0) return;

    const now = new Date();
    const upcoming = appointments.filter(apt => {
      if (apt.status !== 'مؤكد') return false;
      
      try {
        const aptDate = new Date(apt.date);
        const [hours, minutes] = apt.time.split(':').map(Number);
        aptDate.setHours(hours, minutes, 0, 0);
        
        const timeDiff = aptDate.getTime() - now.getTime();
        const minutesDiff = timeDiff / (1000 * 60);
        
        // Notify 15 minutes before
        return minutesDiff > 0 && minutesDiff <= 15;
      } catch (error) {
        return false;
      }
    });

    upcoming.forEach(apt => {
      // Check if we already notified about this appointment
      if (!notifiedAppointments.has(apt.id)) {
        setNotifiedAppointments(prev => new Set(prev).add(apt.id));
        addNotification({
          type: 'appointment-reminder',
          message: `تذكير: موعد ${apt.customerName} مع ${apt.specialist} بعد 15 دقيقة`,
          appointmentId: apt.id,
        });
      }
    });
  }, [notifiedAppointments, addNotification]);

  const checkOpenShifts = useCallback((shifts: any[]) => {
    if (!shifts || shifts.length === 0) return;

    const openShifts = shifts.filter(shift => shift.status === 'open');
    
    openShifts.forEach(shift => {
      try {
        const startTime = new Date(shift.startTime);
        const now = new Date();
        const hoursDiff = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        
        // Alert if shift is open for more than 12 hours
        if (hoursDiff >= 12 && !notifiedShifts.has(shift.id)) {
          setNotifiedShifts(prev => new Set(prev).add(shift.id));
          addNotification({
            type: 'general',
            message: `تنبيه: وردية ${shift.cashier} مفتوحة منذ ${Math.floor(hoursDiff)} ساعة`,
          });
        }
      } catch (error) {
        console.warn('Failed to check shift:', error);
      }
    });
  }, [notifiedShifts, addNotification]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        markAsRead,
        clearAll,
        unreadCount,
        checkUpcomingAppointments,
        checkOpenShifts,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
