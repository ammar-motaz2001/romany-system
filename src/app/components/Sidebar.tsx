import { Link, useLocation } from 'react-router';
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
  Flower2,
  Receipt,
  Clock,
  UsersRound,
  Wallet,
  Truck,
} from 'lucide-react';
import { useApp } from '@/app/context/AppContext';
import { useTranslation } from '@/app/hooks/useTranslation';

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

export default function Sidebar() {
  const location = useLocation();
  const { currentUser, systemSettings } = useApp();
  const { t } = useTranslation();

  // Filter menu items based on user permissions
  const filteredMenuItems = menuItems.filter((item) => {
    // If user is admin or not logged in, show all menu items
    if (!currentUser || currentUser.role === 'admin') {
      return true;
    }
    
    // For cashier users, check permissions
    const permission = item.permission as keyof typeof currentUser.permissions;
    return currentUser.permissions?.[permission] === true;
  });

  return (
    <div className="hidden lg:flex w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 h-screen flex-col overflow-hidden" dir="rtl">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-pink-500 to-purple-600 p-2 rounded-xl">
            <Flower2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-900 dark:text-white">{systemSettings.businessName || t('systemName')}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('systemName')}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 scrollbar-track-transparent">
        <ul className="space-y-1">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-pink-50 to-purple-50 text-pink-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-pink-600' : 'text-gray-500 dark:text-gray-400'}`} />
                  <span>{t(item.labelKey as any)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
        {currentUser && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700">
            {currentUser.image ? (
              <img
                src={currentUser.image}
                alt={currentUser.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {currentUser.name.charAt(0)}
                </span>
              </div>
            )}
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white text-sm">
                {currentUser.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {currentUser.role === 'admin' ? 'مدير' : 'كاشير'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}