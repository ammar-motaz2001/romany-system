import { useState, useEffect } from 'react';
import { Bell, Moon, Sun, LogOut, X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { useNavigate } from 'react-router';
import { useApp } from '@/app/context/AppContext';
import { useTranslation } from '@/app/hooks/useTranslation';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode, notifications, markNotificationAsRead, currentUser, logoutUser } = useApp();
  const { t } = useTranslation();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    logoutUser();
    navigate('/');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (showNotifications && !target.closest('.notifications-container')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  return (
    <header className="hidden lg:block bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-8 py-3 lg:py-4">
      <div className="flex items-center justify-between">
        <div>
          {title && <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>}
          {subtitle && <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          {/* Dark Mode Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 w-9 h-9 lg:w-10 lg:h-10 touch-manipulation"
            onClick={toggleDarkMode}
          >
            {darkMode ? (
              <Sun className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-500" />
            ) : (
              <Moon className="w-4 h-4 lg:w-5 lg:h-5 text-gray-600" />
            )}
          </Button>

          {/* Notifications */}
          <div className="relative notifications-container">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full relative hover:bg-gray-100 dark:hover:bg-gray-800 w-9 h-9 lg:w-10 lg:h-10 touch-manipulation"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-4 h-4 lg:w-5 lg:h-5 text-gray-600 dark:text-gray-300" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-pink-500 rounded-full text-white text-xs flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 lg:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-[80vh] overflow-hidden">
                <div className="p-3 lg:p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="font-bold text-sm lg:text-base text-gray-900 dark:text-white">{t('notifications')}</h3>
                  <button onClick={() => setShowNotifications(false)} className="touch-manipulation">
                    <X className="w-4 h-4 lg:w-5 lg:h-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 lg:p-8 text-center text-gray-500 dark:text-gray-400">
                      <Bell className="w-10 h-10 lg:w-12 lg:h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                      <p className="text-sm lg:text-base">{t('notifications')}</p>
                    </div>
                  ) : (
                    notifications.slice().reverse().map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 lg:p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors active:bg-gray-100 dark:active:bg-gray-600 touch-manipulation ${
                          !notification.read ? 'bg-pink-50 dark:bg-pink-900/10' : ''
                        }`}
                        onClick={() => markNotificationAsRead(notification.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm lg:text-base text-gray-900 dark:text-white mb-1">
                              {notification.title}
                            </h4>
                            <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">{notification.message}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{notification.time}</p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-pink-500 rounded-full mt-1 flex-shrink-0 ml-2"></div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          {currentUser && (
            <div className="hidden lg:flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-xl">
              <img
                src={currentUser.image || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'}
                alt={currentUser.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-700"
              />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{currentUser.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{currentUser.role === 'admin' ? t('admin') : t('cashier')}</p>
              </div>
            </div>
          )}

          {/* Logout */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 w-10 h-10 touch-manipulation"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </Button>
        </div>
      </div>
    </header>
  );
}