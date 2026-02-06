import { useEffect } from 'react';
import { useApp } from '@/app/context/AppContext';
import { useNotifications } from '@/app/context/NotificationContext';

/**
 * Component to monitor and trigger notifications
 * Must be rendered inside AppProvider context
 */
function NotificationsMonitor() {
  const { appointments, shifts } = useApp();
  const { checkUpcomingAppointments, checkOpenShifts } = useNotifications();

  useEffect(() => {
    // Initial check with delay to ensure everything is mounted
    const initialCheck = setTimeout(() => {
      try {
        if (appointments && shifts) {
          checkUpcomingAppointments(appointments);
          checkOpenShifts(shifts);
        }
      } catch (error) {
        console.warn('Initial notification check failed:', error);
      }
    }, 1000);
    
    // Set up interval to check periodically (every 5 minutes)
    const interval = setInterval(() => {
      try {
        if (appointments && shifts) {
          checkUpcomingAppointments(appointments);
          checkOpenShifts(shifts);
        }
      } catch (error) {
        console.warn('Periodic notification check failed:', error);
      }
    }, 5 * 60 * 1000);

    return () => {
      clearTimeout(initialCheck);
      clearInterval(interval);
    };
  }, [appointments, shifts, checkUpcomingAppointments, checkOpenShifts]);

  // This component doesn't render anything
  return null;
}

export default NotificationsMonitor;
