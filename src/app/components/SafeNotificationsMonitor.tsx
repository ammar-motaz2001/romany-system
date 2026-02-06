import { useEffect, useState } from 'react';
import { useApp } from '@/app/context/AppContext';
import { useNotifications } from '@/app/context/NotificationContext';

/**
 * Component to monitor and trigger notifications
 * Must be rendered inside AppProvider context
 * Includes safety checks to prevent HMR-related errors
 */
export default function SafeNotificationsMonitor() {
  const [isReady, setIsReady] = useState(false);
  
  // Always call hooks at the top level - never conditionally
  const { appointments, shifts } = useApp();
  const { checkUpcomingAppointments, checkOpenShifts } = useNotifications();

  useEffect(() => {
    // Mark as ready after a short delay
    const readyTimeout = setTimeout(() => {
      setIsReady(true);
    }, 1000);

    return () => clearTimeout(readyTimeout);
  }, []);

  useEffect(() => {
    if (!isReady || !checkUpcomingAppointments || !checkOpenShifts) {
      return;
    }

    // Initial check with delay to ensure everything is mounted
    const initialCheck = setTimeout(() => {
      try {
        if (appointments && Array.isArray(appointments)) {
          checkUpcomingAppointments(appointments);
        }
        if (shifts && Array.isArray(shifts)) {
          checkOpenShifts(shifts);
        }
      } catch (error) {
        console.warn('Initial notification check failed:', error);
      }
    }, 2000);
    
    // Set up interval to check periodically (every 5 minutes)
    const interval = setInterval(() => {
      try {
        if (appointments && Array.isArray(appointments)) {
          checkUpcomingAppointments(appointments);
        }
        if (shifts && Array.isArray(shifts)) {
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
  }, [isReady, appointments, shifts, checkUpcomingAppointments, checkOpenShifts]);

  return null;
}