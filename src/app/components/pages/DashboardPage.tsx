import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LabelList } from 'recharts';
import { 
  DollarSign, TrendingUp, Receipt, UserPlus, Users, Calendar, 
  Clock, Package, AlertTriangle, Briefcase, UserCheck, FileText 
} from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { useApp } from '@/app/context/AppContext';
import { useNavigate } from 'react-router';
import { useTranslation } from '@/app/hooks/useTranslation';
import { useEffect } from 'react';
import { NotificationManager } from '@/app/utils/notifications';
import Header from '@/app/components/Header';

export default function DashboardPage() {
  const { 
    sales = [], 
    customers = [], 
    appointments = [], 
    services = [], 
    expenses = [],
    inventory = [],
    attendanceRecords = [],
    shifts = [],
    employees = [],
    currentUser,
    systemSettings
  } = useApp();
  
  const navigate = useNavigate();
  const { t, currentLanguage } = useTranslation();
  const isRTL = currentLanguage === 'ar';

  // Get today's date
  const today = new Date().toLocaleDateString('en-CA');
  const todayDisplay = new Date().toLocaleDateString(currentLanguage === 'ar' ? 'ar-EG' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Helper function to check if two dates are the same
  const isSameDate = (date1: string, date2: string): boolean => {
    try {
      // Normalize both dates to YYYY-MM-DD format
      const normalize = (dateStr: string): string => {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) {
          // If invalid, try to match today's date
          return dateStr;
        }
        return d.toLocaleDateString('en-CA');
      };
      
      const normalized1 = normalize(date1);
      const normalized2 = normalize(date2);
      return normalized1 === normalized2;
    } catch {
      return date1 === date2;
    }
  };

  // Find current open shift (for the logged-in user if cashier, any open shift if admin)
  const currentOpenShift = currentUser?.role === 'cashier' 
    ? shifts.find(s => s.cashier === currentUser?.name && s.status === 'open')
    : shifts.find(s => s.status === 'open');

  // Use shift date if there's an open shift, otherwise use today
  const activeDate = currentOpenShift ? currentOpenShift.date : today;
  const shiftDisplay = currentOpenShift 
    ? (currentLanguage === 'ar' ? `الوردية الحالية - ${currentOpenShift.cashier}` : `Current Shift - ${currentOpenShift.cashier}`)
    : todayDisplay;

  // 1. SHIFT/TODAY STATS - Based on active shift or today
  const shiftSales = sales.filter(s => isSameDate(s.date, activeDate));
  const shiftRevenue = shiftSales.reduce((sum, sale) => sum + sale.amount, 0);
  const shiftInvoicesCount = shiftSales.length;
  
  const shiftCustomers = new Set(shiftSales.map(s => s.customer)).size;
  
  // Filter appointments: show only active appointments (exclude completed and cancelled)
  const shiftAppointments = appointments.filter(a => 
    isSameDate(a.date, activeDate) && 
    a.status !== 'منتهي' && 
    a.status !== 'completed' && 
    a.status !== 'ملغي' && 
    a.status !== 'cancelled'
  );
  const shiftAppointmentsCount = shiftAppointments.length;
  
  const lowStockProducts = inventory.filter(p => p.stock <= p.minStock);
  const lowStockCount = lowStockProducts.length;
  
  const shiftAttendance = attendanceRecords.filter(a => isSameDate(a.date, activeDate) && a.status === 'حاضر');
  const presentEmployeesCount = shiftAttendance.length;
  
  // Total employees count
  const totalEmployeesCount = employees.length;

  // Check for low stock and send notifications
  useEffect(() => {
    lowStockProducts.forEach(product => {
      NotificationManager.notifyLowStock(product.name, product.stock);
    });
  }, [lowStockProducts.length]); // Only trigger when count changes

  // 2. SALES CHART (Last 7 Days)
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-CA');
      const dayName = date.toLocaleDateString(currentLanguage === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short' });
      
      const daySales = sales.filter(s => {
        const saleDate = s.date;
        return isSameDate(saleDate, dateStr);
      });
      const revenue = daySales.reduce((sum, sale) => sum + sale.amount, 0);
      
      days.push({ day: dayName, revenue });
    }
    return days;
  };
  const last7DaysData = getLast7Days();

  // 3. TOP SERVICES
  const servicesSales: { [key: string]: number } = {};
  sales.forEach(sale => {
    // Extract service name (handle both single services and multi-item invoices)
    let serviceName = sale.service;
    
    // If service contains quantity info like "Service (2)", extract just the service name
    if (serviceName.includes('(') && serviceName.includes(')')) {
      // Split by comma for multi-service invoices
      const services = serviceName.split(',').map(s => {
        const match = s.match(/^(.*?)\s*\(/);
        return match ? match[1].trim() : s.trim();
      });
      
      const amountPerService = sale.amount / services.length;
      services.forEach(svc => {
        servicesSales[svc] = (servicesSales[svc] || 0) + amountPerService;
      });
    } else {
      servicesSales[serviceName] = (servicesSales[serviceName] || 0) + sale.amount;
    }
  });
  
  const topServices = Object.entries(servicesSales)
    .map(([name, revenue]) => ({ 
      name: name.length > 25 ? name.substring(0, 25) + '...' : name, 
      revenue: Math.round(revenue * 100) / 100 
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const COLORS = ['#ec4899', '#a855f7', '#f97316', '#3b82f6', '#10b981'];

  // 4. SMART ALERTS
  const alerts = [];
  
  // Low stock alert
  if (lowStockCount > 0) {
    alerts.push({
      type: 'warning',
      icon: <Package className="w-5 h-5" />,
      title: currentLanguage === 'ar' ? 'مخزون منخفض' : 'Low Stock',
      message: currentLanguage === 'ar' 
        ? `${lowStockCount} منتج قارب على النفاد`
        : `${lowStockCount} products running low`,
      action: () => navigate('/inventory')
    });
  }

  // Late employees
  const lateEmployees = attendanceRecords.filter(a => isSameDate(a.date, activeDate) && a.status === 'متأخر');
  if (lateEmployees.length > 0) {
    alerts.push({
      type: 'info',
      icon: <Clock className="w-5 h-5" />,
      title: currentLanguage === 'ar' ? 'موظف متأخر' : 'Late Employee',
      message: currentLanguage === 'ar'
        ? `${lateEmployees.length} موظف تأخر في الحضور`
        : `${lateEmployees.length} employee(s) arrived late`,
      action: () => navigate('/attendance')
    });
  }

  // Upcoming appointments (next hour)
  const now = new Date();
  const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
  const upcomingAppointments = shiftAppointments.filter(apt => {
    const aptTime = new Date(`${apt.date} ${apt.time}`);
    return aptTime > now && aptTime <= nextHour && apt.status === 'confirmed';
  });
  
  if (upcomingAppointments.length > 0) {
    alerts.push({
      type: 'success',
      icon: <Calendar className="w-5 h-5" />,
      title: currentLanguage === 'ar' ? 'مواعيد قريبة' : 'Upcoming Appointments',
      message: currentLanguage === 'ar'
        ? `${upcomingAppointments.length} موعد خلال الساعة القادمة`
        : `${upcomingAppointments.length} appointment(s) in the next hour`,
      action: () => navigate('/appointments')
    });
  }

  // Open shifts not closed
  const openShifts = shifts.filter(s => s.status === 'open');
  if (openShifts.length > 0) {
    alerts.push({
      type: 'error',
      icon: <AlertTriangle className="w-5 h-5" />,
      title: currentLanguage === 'ar' ? 'شيفت مفتوح' : 'Open Shift',
      message: currentLanguage === 'ar'
        ? `${openShifts.length} شيفت لم يتم إقفاله`
        : `${openShifts.length} shift(s) not closed`,
      action: () => navigate('/shifts')
    });
  }

  // 5. LATEST TRANSACTIONS
  const latestInvoices = [...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);
  const latestExpenses = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);
  const latestAttendance = [...attendanceRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);

  // Note: shiftRevenue and shiftSales are already calculated above based on currentOpenShift

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900">
      <Header 
        title={currentLanguage === 'ar' ? 'الصفحة الرئيسية' : 'Dashboard'} 
        subtitle={shiftDisplay}
      />

      <div className="p-8 space-y-8">
        {/* Shift Status Alert */}
        {currentOpenShift && (
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-lg">
                    {currentLanguage === 'ar' ? '✅ الوردية مفتوحة' : '✅ Shift is Open'}
                  </p>
                  <p className="text-sm text-white/90">
                    {currentLanguage === 'ar' 
                      ? `الكاشير: ${currentOpenShift.cashier} - الرصيد الافتتاحي: ${currentOpenShift.openingBalance} ج.م`
                      : `Cashier: ${currentOpenShift.cashier} - Opening Balance: ${currentOpenShift.openingBalance} EGP`
                    }
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/80 mb-1">{currentLanguage === 'ar' ? 'إجمالي المبيعات' : 'Total Sales'}</p>
                <p className="text-2xl font-black">{shiftRevenue.toFixed(0)} {currentLanguage === 'ar' ? 'ج.م' : 'EGP'}</p>
              </div>
            </div>
          </div>
        )}

        {!currentOpenShift && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center gap-3 text-white">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-lg">
                  {currentLanguage === 'ar' ? '⚠️ لا توجد وردية مفتوحة' : '⚠️ No Open Shift'}
                </p>
                <p className="text-sm text-white/90">
                  {currentLanguage === 'ar' 
                    ? 'يرجى فتح وردية جديدة من صفحة إدارة الورديات'
                    : 'Please open a new shift from the Shifts page'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 1. TOP STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
          {/* Shift Sales */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border-2 border-pink-200 dark:border-pink-800 hover:border-pink-400 dark:hover:border-pink-600 transition-all duration-300 p-5 group hover:shadow-2xl hover:-translate-y-1">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-pink-200/30 dark:bg-pink-700/30 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-gradient-to-br from-pink-500 via-pink-600 to-rose-600 rounded-2xl shadow-lg shadow-pink-500/50 group-hover:shadow-pink-500/70 group-hover:scale-110 transition-all duration-300">
                  <DollarSign className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <div className="px-2.5 py-1 bg-pink-500/10 dark:bg-pink-500/20 rounded-full">
                  <TrendingUp className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                </div>
              </div>
              <p className="text-xs font-bold text-pink-600 dark:text-pink-400 mb-1.5 uppercase tracking-wider">{currentLanguage === 'ar' ? 'إجمالي المبيعات' : 'Total Sales'}</p>
              <h3 className="text-2xl font-black text-pink-700 dark:text-pink-300 leading-tight">
                {shiftRevenue.toFixed(0)}
                <span className="text-sm font-semibold mr-1">{currentLanguage === 'ar' ? 'ج.م' : 'EGP'}</span>
              </h3>
            </div>
          </Card>

          {/* Invoices Count */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 transition-all duration-300 p-5 group hover:shadow-2xl hover:-translate-y-1">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-purple-200/30 dark:bg-purple-700/30 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-gradient-to-br from-purple-500 via-purple-600 to-violet-600 rounded-2xl shadow-lg shadow-purple-500/50 group-hover:shadow-purple-500/70 group-hover:scale-110 transition-all duration-300">
                  <Receipt className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <div className="px-2.5 py-1 bg-purple-500/10 dark:bg-purple-500/20 rounded-full">
                  <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <p className="text-xs font-bold text-purple-600 dark:text-purple-400 mb-1.5 uppercase tracking-wider">{currentLanguage === 'ar' ? 'عدد الفواتير' : 'Invoices'}</p>
              <h3 className="text-2xl font-black text-purple-700 dark:text-purple-300 leading-tight">{shiftInvoicesCount}</h3>
            </div>
          </Card>

          {/* Shift Customers */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border-2 border-cyan-200 dark:border-cyan-800 hover:border-cyan-400 dark:hover:border-cyan-600 transition-all duration-300 p-5 group hover:shadow-2xl hover:-translate-y-1">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-cyan-200/30 dark:bg-cyan-700/30 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-gradient-to-br from-cyan-500 via-cyan-600 to-blue-600 rounded-2xl shadow-lg shadow-cyan-500/50 group-hover:shadow-cyan-500/70 group-hover:scale-110 transition-all duration-300">
                  <UserPlus className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <div className="px-2.5 py-1 bg-cyan-500/10 dark:bg-cyan-500/20 rounded-full">
                  <Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                </div>
              </div>
              <p className="text-xs font-bold text-cyan-600 dark:text-cyan-400 mb-1.5 uppercase tracking-wider">{currentLanguage === 'ar' ? 'العملاء' : 'Customers'}</p>
              <h3 className="text-2xl font-black text-cyan-700 dark:text-cyan-300 leading-tight">{shiftCustomers}</h3>
            </div>
          </Card>

          {/* Shift Appointments */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-200 dark:border-amber-800 hover:border-amber-400 dark:hover:border-amber-600 transition-all duration-300 p-5 group hover:shadow-2xl hover:-translate-y-1">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-amber-200/30 dark:bg-amber-700/30 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 rounded-2xl shadow-lg shadow-amber-500/50 group-hover:shadow-amber-500/70 group-hover:scale-110 transition-all duration-300">
                  <Calendar className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <div className="px-2.5 py-1 bg-amber-500/10 dark:bg-amber-500/20 rounded-full">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-1.5 uppercase tracking-wider">{currentLanguage === 'ar' ? 'المواعيد النشطة' : 'Active Appointments'}</p>
              <h3 className="text-2xl font-black text-amber-700 dark:text-amber-300 leading-tight">{shiftAppointmentsCount}</h3>
              <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1">
                {currentLanguage === 'ar' ? 'مواعيد مؤكدة وقيد الانتظار' : 'Confirmed & Pending'}
              </p>
            </div>
          </Card>

          {/* Low Stock Products */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-2 border-red-200 dark:border-red-800 hover:border-red-400 dark:hover:border-red-600 transition-all duration-300 p-5 group hover:shadow-2xl hover:-translate-y-1">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-red-200/30 dark:bg-red-700/30 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-gradient-to-br from-red-500 via-red-600 to-rose-600 rounded-2xl shadow-lg shadow-red-500/50 group-hover:shadow-red-500/70 group-hover:scale-110 transition-all duration-300">
                  <Package className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <div className="px-2.5 py-1 bg-red-500/10 dark:bg-red-500/20 rounded-full">
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-1.5 uppercase tracking-wider">{currentLanguage === 'ar' ? 'مخزون منخفض' : 'Low Stock'}</p>
              <h3 className="text-2xl font-black text-red-700 dark:text-red-300 leading-tight">{lowStockCount}</h3>
            </div>
          </Card>

          {/* Present Employees */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-2 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all duration-300 p-5 group hover:shadow-2xl hover:-translate-y-1">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-200/30 dark:bg-emerald-700/30 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-600 rounded-2xl shadow-lg shadow-emerald-500/50 group-hover:shadow-emerald-500/70 group-hover:scale-110 transition-all duration-300">
                  <UserCheck className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <div className="px-2.5 py-1 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full">
                  <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1.5 uppercase tracking-wider">{currentLanguage === 'ar' ? 'الموظفين' : 'Staff'}</p>
              <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-300 leading-tight">{totalEmployeesCount}</h3>
              <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">
                {currentLanguage === 'ar' ? `${presentEmployeesCount} حاضر اليوم` : `${presentEmployeesCount} present today`}
              </p>
            </div>
          </Card>
        </div>

        {/* 2. SALES LAST 7 DAYS STATISTICS */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            {currentLanguage === 'ar' ? '📊 مبيعات آخر 7 أيام' : '📊 Sales Last 7 Days'}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {last7DaysData.reverse().map((day, index) => {
              const isToday = index === last7DaysData.length - 1;
              return (
                <Card 
                  key={index}
                  className={`p-4 text-center hover:shadow-xl transition-all duration-300 ${
                    isToday ? 'bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border-2 border-pink-300' : ''
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      day.revenue > 0 
                        ? 'bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg' 
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}>
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        {day.day}
                      </p>
                      <p className={`text-lg font-bold ${
                        day.revenue > 0 
                          ? 'text-pink-600 dark:text-pink-400' 
                          : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        {day.revenue.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {systemSettings.currency}
                      </p>
                    </div>
                    {isToday && (
                      <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse mt-1"></div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* 3. SHIFT APPOINTMENTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Shift Appointments */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {currentLanguage === 'ar' ? '📅 المواعيد النشطة' : "📅 Active Appointments"}
              </h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/appointments')}
                className="text-pink-600"
              >
                {currentLanguage === 'ar' ? 'الكل' : 'All'}
              </Button>
            </div>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {shiftAppointments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  {currentLanguage === 'ar' ? 'لا توجد مواعيد نشطة' : 'No active appointments'}
                </p>
              ) : (
                shiftAppointments.map(apt => (
                  <div key={apt.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{apt.customer}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{apt.service}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        apt.status === 'مؤكد' || apt.status === 'confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        apt.status === 'منتهي' || apt.status === 'completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        apt.status === 'ملغي' || apt.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {currentLanguage === 'ar' ? 
                          (apt.status === 'مؤكد' || apt.status === 'confirmed' ? 'مؤكد' :
                           apt.status === 'منتهي' || apt.status === 'completed' ? 'منتهي' :
                           apt.status === 'ملغي' || apt.status === 'cancelled' ? 'ملغي' : 
                           apt.status === 'قيد الانتظار' || apt.status === 'pending' ? 'قيد الانتظار' : apt.status) :
                          apt.status
                        }
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{apt.time}</span>
                      <span>{apt.specialist}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* TOP SERVICES STATISTICS */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            {currentLanguage === 'ar' ? '📊 أكثر الخدمات مبيعًا' : '📊 Top Services'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {(topServices.length > 0 ? topServices : [
              { name: currentLanguage === 'ar' ? 'لا توجد خدمات' : 'No Services', revenue: 0 }
            ]).map((service, index) => {
              const colors = [
                { bg: 'from-pink-500 to-rose-600', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-200' },
                { bg: 'from-purple-500 to-violet-600', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200' },
                { bg: 'from-blue-500 to-indigo-600', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200' },
                { bg: 'from-green-500 to-emerald-600', text: 'text-green-600 dark:text-green-400', border: 'border-green-200' },
                { bg: 'from-orange-500 to-amber-600', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200' }
              ];
              const color = colors[index % colors.length];
              
              return (
                <Card 
                  key={index}
                  className={`p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                    index === 0 ? `border-2 ${color.border}` : ''
                  }`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br ${color.bg} shadow-lg`}>
                      <span className="text-2xl font-bold text-white">#{index + 1}</span>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 line-clamp-2 min-h-[40px]">
                        {service.name}
                      </p>
                      <p className={`text-2xl font-bold ${color.text}`}>
                        {service.revenue.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {systemSettings.currency}
                      </p>
                    </div>
                    {index === 0 && service.revenue > 0 && (
                      <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                        <TrendingUp className="h-3 w-3" />
                        <span>{currentLanguage === 'ar' ? 'الأعلى' : 'Top'}</span>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* 4. SMART ALERTS */}
        {alerts.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
              {currentLanguage === 'ar' ? '🔔 التنبيهات الذكية' : '🔔 Smart Alerts'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  onClick={alert.action}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg ${
                    alert.type === 'warning' ? 'border-orange-200 bg-orange-50 hover:border-orange-300' :
                    alert.type === 'error' ? 'border-red-200 bg-red-50 hover:border-red-300' :
                    alert.type === 'success' ? 'border-green-200 bg-green-50 hover:border-green-300' :
                    'border-blue-200 bg-blue-50 hover:border-blue-300'
                  }`}
                >
                  <div className={`mb-3 ${
                    alert.type === 'warning' ? 'text-orange-600' :
                    alert.type === 'error' ? 'text-red-600' :
                    alert.type === 'success' ? 'text-green-600' :
                    'text-blue-600'
                  }`}>
                    {alert.icon}
                  </div>
                  <h4 className="font-bold text-gray-900 mb-1">{alert.title}</h4>
                  <p className="text-sm text-gray-600">{alert.message}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 5. LATEST TRANSACTIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Latest Invoices */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {currentLanguage === 'ar' ? '🧾 آخر الفواتير' : '🧾 Latest Invoices'}
              </h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/invoices')}
                className="text-pink-600"
              >
                {currentLanguage === 'ar' ? 'الكل' : 'All'}
              </Button>
            </div>
            <div className="space-y-3">
              {latestInvoices.map(invoice => (
                <div key={invoice.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{invoice.customer}</p>
                    <span className="text-green-600 font-bold text-sm">{invoice.amount} {currentLanguage === 'ar' ? 'ج.م' : 'EGP'}</span>
                  </div>
                  <p className="text-xs text-gray-500">{invoice.service}</p>
                  <p className="text-xs text-gray-400 mt-1">{invoice.date}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Latest Expenses */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {currentLanguage === 'ar' ? '💸 آخر المصروفات' : '💸 Latest Expenses'}
              </h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/expenses')}
                className="text-pink-600"
              >
                {currentLanguage === 'ar' ? 'الكل' : 'All'}
              </Button>
            </div>
            <div className="space-y-3">
              {latestExpenses.map(expense => (
                <div key={expense.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{expense.description}</p>
                    <span className="text-red-600 font-bold text-sm">-{expense.amount} {currentLanguage === 'ar' ? 'ج.م' : 'EGP'}</span>
                  </div>
                  <p className="text-xs text-gray-500">{expense.category}</p>
                  <p className="text-xs text-gray-400 mt-1">{expense.date}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Latest Attendance */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {currentLanguage === 'ar' ? '👤 آخر تسجيلات الحضور' : '👤 Latest Attendance'}
              </h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/attendance')}
                className="text-pink-600"
              >
                {currentLanguage === 'ar' ? 'الكل' : 'All'}
              </Button>
            </div>
            <div className="space-y-3">
              {latestAttendance.map(att => (
                <div key={att.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{att.employeeName}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      att.status === 'present' ? 'bg-green-100 text-green-700' :
                      att.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {currentLanguage === 'ar' ?
                        (att.status === 'present' ? 'حاضر' :
                         att.status === 'late' ? 'متأخر' : 'غائب') :
                        att.status
                      }
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{att.checkIn}</p>
                  <p className="text-xs text-gray-400 mt-1">{att.date}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* 6. SHIFT SUMMARY (for Cashier) */}
        {currentUser?.role === 'cashier' && (
          <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-2 border-indigo-200">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
              {currentLanguage === 'ar' ? '👔 ملخص الشيفت' : '👔 Shift Summary'}
            </h3>
            {currentOpenShift ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {currentLanguage === 'ar' ? 'حالة الشيفت' : 'Shift Status'}
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {currentLanguage === 'ar' ? '✅ مفتوح' : '✅ Open'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {currentLanguage === 'ar' ? 'إجمالي المبيعات' : 'Total Sales'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {shiftRevenue.toFixed(0)} {currentLanguage === 'ar' ? 'ج.م' : 'EGP'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {currentLanguage === 'ar' ? 'الكاش المتوقع' : 'Expected Cash'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {(currentOpenShift.openingBalance + shiftRevenue).toFixed(0)} {currentLanguage === 'ar' ? 'ج.م' : 'EGP'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                {currentLanguage === 'ar' ? 'لا يوجد شيفت مفتوح حالياً' : 'No open shift currently'}
              </p>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}