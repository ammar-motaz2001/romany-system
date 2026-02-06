import { useEffect, useRef } from 'react';
import { NotificationManager } from '@/app/utils/notifications';

interface Appointment {
  id: string;
  date: string;
  time: string;
  customer: string;
  service: string;
  status: string;
}

interface Shift {
  id: string;
  status: string;
  startTime: string;
  totalSales: number;
}

interface UseNotificationsProps {
  appointments: Appointment[];
  shifts: Shift[];
}

export function useNotifications({ appointments, shifts }: UseNotificationsProps) {
  const notifiedAppointments = useRef<Set<string>>(new Set());
  const shiftReminderSent = useRef<boolean>(false);

  useEffect(() => {
    // Check appointments every minute
    const checkAppointments = () => {
      const now = new Date();
      const today = now.toISOString().split('T')[0]; // YYYY-MM-DD

      appointments.forEach(appointment => {
        // Skip if not today or already completed/cancelled
        if (
          appointment.date.split('T')[0] !== today ||
          appointment.status === 'مكتمل' ||
          appointment.status === 'ملغي'
        ) {
          return;
        }

        // Parse appointment time
        const [hours, minutes] = appointment.time.split(':').map(Number);
        const appointmentDate = new Date();
        appointmentDate.setHours(hours, minutes, 0, 0);

        const timeDiff = appointmentDate.getTime() - now.getTime();
        const minutesUntil = Math.floor(timeDiff / (1000 * 60));

        // Create unique key for each notification timing
        const key15 = `${appointment.id}-15`;
        const key5 = `${appointment.id}-5`;
        const key0 = `${appointment.id}-0`;

        // Notify 15 minutes before
        if (minutesUntil === 15 && !notifiedAppointments.current.has(key15)) {
          NotificationManager.notifyUpcomingAppointment(
            appointment.customer,
            appointment.service,
            15
          );
          notifiedAppointments.current.add(key15);
        }

        // Notify 5 minutes before
        if (minutesUntil === 5 && !notifiedAppointments.current.has(key5)) {
          NotificationManager.notifyUpcomingAppointment(
            appointment.customer,
            appointment.service,
            5
          );
          notifiedAppointments.current.add(key5);
        }

        // Notify when appointment time arrives
        if (minutesUntil === 0 && !notifiedAppointments.current.has(key0)) {
          NotificationManager.notifyUpcomingAppointment(
            appointment.customer,
            appointment.service,
            0
          );
          notifiedAppointments.current.add(key0);
        }
      });
    };

    // Check for shift closing reminder
    const checkShiftReminder = () => {
      const now = new Date();
      const currentHour = now.getHours();
      
      // Send reminder at 8 PM (20:00) if there's an open shift
      const openShift = shifts.find(s => s.status === 'open');
      
      if (openShift && currentHour === 20 && !shiftReminderSent.current) {
        NotificationManager.notifyShiftClosingReminder(openShift.totalSales);
        shiftReminderSent.current = true;
      }

      // Reset reminder flag at midnight
      if (currentHour === 0) {
        shiftReminderSent.current = false;
      }
    };

    // Initial check
    checkAppointments();
    checkShiftReminder();

    // Check every minute
    const interval = setInterval(() => {
      checkAppointments();
      checkShiftReminder();
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [appointments, shifts]);

  // Clean up old notifications when component unmounts
  useEffect(() => {
    return () => {
      notifiedAppointments.current.clear();
    };
  }, []);
}
