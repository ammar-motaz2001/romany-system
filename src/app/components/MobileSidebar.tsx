import {
  LayoutDashboard,
  ShoppingBag,
  FileText,
  Users,
  Calendar,
  Package,
  BarChart3,
  DollarSign,
  UserCheck,
  Settings,
  Receipt,
  Clock,
  UsersRound,
  Wallet,
  Truck,
  Menu,
  X,
  Flower2,
  Bell,
  User,
  LogOut,
} from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useApp } from '@/app/context/AppContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import { useState, useEffect } from 'react';

// Map permissions to sidebar menu items
const menuItems = [
  { icon: LayoutDashboard, labelKey: 'dashboard', path: '/dashboard', permission: 'dashboard' },
  { icon: ShoppingBag, labelKey: 'sales', path: '/pos', permission: 'sales' },
  { icon: FileText, labelKey: 'invoices', path: '/invoices', permission: 'invoices' },
  { icon: Users, labelKey: 'customers', path: '/customers', permission: 'customers' },
  { icon: Calendar, labelKey: 'appointments', path: '/appointments', permission: 'appointments' },
  { icon: Package, labelKey: 'inventory', path: '/inventory', permission: 'inventory' },
  { icon: DollarSign, labelKey: 'services', path: '/services', permission: 'services' },
  { icon: Receipt, labelKey: 'expenses', path: '/expenses', permission: 'expenses' },
  { icon: Clock, labelKey: 'shifts', path: '/shifts', permission: 'shifts' },
  { icon: UsersRound, labelKey: 'employees', path: '/employees', permission: 'employees' },
  { icon: UserCheck, labelKey: 'attendance', path: '/attendance', permission: 'attendance' },
  { icon: Wallet, labelKey: 'payroll', path: '/payroll', permission: 'payroll' },
  { icon: BarChart3, labelKey: 'reports', path: '/reports', permission: 'reports' },
  { icon: Truck, labelKey: 'suppliers', path: '/suppliers', permission: 'suppliers' },
  { icon: Settings, labelKey: 'settings', path: '/settings', permission: 'settings' },
];

export default function MobileSidebar() {
  const location = useLocation();
  const { currentUser, systemSettings, notifications, logoutUser, markNotificationAsRead } = useApp();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Filter menu items based on user permissions
  const filteredMenuItems = menuItems.filter((item) => {
    if (!currentUser || currentUser.role === 'admin') {
      return true;
    }
    const permission = item.permission as keyof typeof currentUser.permissions;
    return currentUser.permissions?.[permission] === true;
  });

  // Close drawer when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Prevent scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (showNotifications && !target.closest('.mobile-notifications-container')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-40">
        <div className="flex items-center justify-between px-4 py-3" dir="rtl">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-pink-500 to-purple-600 p-2 rounded-lg">
              <Flower2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-base text-gray-900 dark:text-white">
              {systemSettings.businessName || t('systemName')}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative mobile-notifications-container">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute left-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-[70vh] overflow-hidden">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h3 className="font-bold text-base text-gray-900 dark:text-white">{t('notifications')}</h3>
                    <button onClick={() => setShowNotifications(false)}>
                      <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                        <p>لا توجد إشعارات</p>
                      </div>
                    ) : (
                      notifications.slice().reverse().map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                            !notification.read ? 'bg-pink-50 dark:bg-pink-900/10' : ''
                          }`}
                          onClick={() => {
                            markNotificationAsRead(notification.id);
                            setShowNotifications(false);
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-1">
                                {notification.title}
                              </h4>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                {notification.time}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-pink-500 rounded-full mt-1 mr-2"></div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* Menu Button */}
            <button
              onClick={() => setIsOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 lg:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-pink-500 to-purple-600 p-2 rounded-xl">
              <Flower2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-900 dark:text-white">
                {systemSettings.businessName || t('systemName')}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('systemName')}</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* User Profile */}
        {currentUser && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              {currentUser.image ? (
                <img
                  src={currentUser.image}
                  alt={currentUser.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                  {currentUser.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {currentUser.role === 'admin' ? 'مدير' : 'كاشير'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 240px)' }}>
          <ul className="space-y-1">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all touch-manipulation ${
                      isActive
                        ? 'bg-gradient-to-r from-pink-50 to-purple-50 text-pink-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600'
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${isActive ? 'text-pink-600' : 'text-gray-500 dark:text-gray-400'}`} />
                    <span className="text-base">{t(item.labelKey as any)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Link
            to="/"
            onClick={() => {
              logoutUser();
              setIsOpen(false);
            }}
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all touch-manipulation"
          >
            <LogOut className="w-6 h-6" />
            <span className="font-medium text-base">تسجيل الخروج</span>
          </Link>
        </div>
      </div>
    </>
  );
}