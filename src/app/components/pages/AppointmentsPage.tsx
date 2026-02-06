import { useState } from 'react';
import { Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight, MoreVertical, Check, Clock, Edit2, X, Users, Play, CheckCircle, Search, Trash2 } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import Header from '@/app/components/Header';
import AddAppointmentDialog from '@/app/components/dialogs/AddAppointmentDialog';
import { useApp } from '@/app/context/AppContext';

export default function AppointmentsPage() {
  const { appointments, searchQuery, updateAppointment, specialists, deleteAppointment } = useApp();
  
  // Calendar state
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-11
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(today.getDate());
  
  const [activeFilter, setActiveFilter] = useState('مواعيد اليوم');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [selectedSpecialist, setSelectedSpecialist] = useState<string>('الكل');
  const [showDetailedReport, setShowDetailedReport] = useState(false);
  
  // Search filters for completed appointments
  const [completedSearchTerm, setCompletedSearchTerm] = useState('');
  const [completedSearchType, setCompletedSearchType] = useState<'day' | 'month' | 'year' | 'customer' | 'all'>('all');
  const [completedSearchDate, setCompletedSearchDate] = useState('');

  const filters = ['مواعيد اليوم', 'قادمة', 'معلقة', 'ملغاة', 'منتهي'];

  // Get today's date info
  const todayDate = today.getDate();
  const todayMonth = today.toLocaleDateString('ar-EG', { month: 'long' });
  const todayYear = today.getFullYear();

  // Calendar functions
  const getMonthName = (month: number, year: number) => {
    const date = new Date(year, month, 1);
    return date.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Add empty cells for days before month starts (adjust for Arabic calendar starting Sunday)
    const startOffset = firstDay === 0 ? 6 : firstDay - 1; // Convert to Monday start
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }

    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  const isSelectedDateToday = () => {
    return (
      selectedDate === todayDate &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  // Helper function to check if appointment is today
  const isToday = (appointmentDate: string | undefined) => {
    if (!appointmentDate) return false;
    try {
      const aptDate = new Date(appointmentDate);
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      return aptDate >= todayStart && aptDate < todayEnd;
    } catch (error) {
      return false;
    }
  };

  // Helper function to check if appointment is upcoming (future)
  const isUpcoming = (appointmentDate: string | undefined) => {
    if (!appointmentDate) return false;
    try {
      const aptDate = new Date(appointmentDate);
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      return aptDate > todayStart;
    } catch (error) {
      return false;
    }
  };

  // Filter appointments based on active filter
  const getFilteredAppointments = () => {
    let filtered = appointments;

    // Filter by status
    if (activeFilter === 'مواعيد اليوم') {
      // Today's appointments that are NOT completed
      filtered = filtered.filter(apt => isToday(apt.date) && apt.status !== 'مكتمل');
    } else if (activeFilter === 'قادمة') {
      // Upcoming appointments that are NOT completed
      filtered = filtered.filter(apt => isUpcoming(apt.date) && apt.status !== 'مكتمل');
    } else if (activeFilter === 'معلقة') {
      // Pending appointments that are NOT completed
      filtered = filtered.filter(apt => apt.status === 'معلق' && apt.status !== 'مكتمل');
    } else if (activeFilter === 'ملغاة') {
      // Cancelled appointments only
      filtered = filtered.filter(apt => apt.status === 'ملغي');
    } else if (activeFilter === 'منتهي') {
      // Completed appointments ONLY
      filtered = filtered.filter(apt => apt.status === 'مكتمل');
    }

    // Filter by specialist
    if (selectedSpecialist !== 'الكل') {
      filtered = filtered.filter(apt => apt.specialist === selectedSpecialist);
    }

    // Filter by search query
    filtered = filtered.filter(apt =>
      apt.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (apt.specialist && apt.specialist.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return filtered;
  };

  const filteredAppointments = getFilteredAppointments();

  // Calculate real statistics - excluding completed appointments from today/upcoming counts
  const todayCount = appointments.filter(apt => isToday(apt.date) && apt.status !== 'مكتمل').length;
  const upcomingCount = appointments.filter(apt => isUpcoming(apt.date) && apt.status !== 'مكتمل').length;
  const pendingCount = appointments.filter(apt => apt.status === 'معلق').length;
  const cancelledCount = appointments.filter(apt => apt.status === 'ملغي').length;
  const completedCount = appointments.filter(apt => apt.status === 'مكتمل').length;

  // Get unique specialists from appointments
  const uniqueSpecialists = Array.from(new Set(appointments.map(apt => apt.specialist).filter(Boolean)));

  const handleEditAppointment = (appointment: any) => {
    setEditingAppointment(appointment);
  };

  const handleSaveEdit = () => {
    if (editingAppointment) {
      updateAppointment(editingAppointment.id, {
        customer: editingAppointment.customer,
        service: editingAppointment.service,
        time: editingAppointment.time,
        status: editingAppointment.status,
      });
      setEditingAppointment(null);
    }
  };

  // Handle start service
  const handleStartService = (appointmentId: string) => {
    updateAppointment(appointmentId, {
      status: 'جاري التنفيذ',
    });
  };

  // Handle complete service
  const handleCompleteService = (appointmentId: string) => {
    updateAppointment(appointmentId, {
      status: 'مكتمل',
    });
  };

  // Filter completed appointments by search
  const getFilteredCompletedAppointments = () => {
    let completed = appointments.filter(apt => apt.status === 'مكتمل');

    // Search by customer name
    if (completedSearchTerm && completedSearchType === 'customer') {
      completed = completed.filter(apt =>
        apt.customer.toLowerCase().includes(completedSearchTerm.toLowerCase())
      );
    }

    // Search by date
    if (completedSearchDate && completedSearchType !== 'all') {
      completed = completed.filter(apt => {
        if (!apt.date) return false;
        const aptDate = new Date(apt.date);

        if (completedSearchType === 'day') {
          const searchDate = new Date(completedSearchDate);
          return (
            aptDate.getDate() === searchDate.getDate() &&
            aptDate.getMonth() === searchDate.getMonth() &&
            aptDate.getFullYear() === searchDate.getFullYear()
          );
        } else if (completedSearchType === 'month') {
          const searchDate = new Date(completedSearchDate);
          return (
            aptDate.getMonth() === searchDate.getMonth() &&
            aptDate.getFullYear() === searchDate.getFullYear()
          );
        } else if (completedSearchType === 'year') {
          const searchDate = new Date(completedSearchDate);
          return aptDate.getFullYear() === searchDate.getFullYear();
        }

        return true;
      });
    }

    return completed;
  };

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900" dir="rtl">
      <Header title="المواعيد والمتابعة" />

      <div className="p-8 flex gap-6">
        {/* Left Sidebar */}
        <div className="w-80 space-y-6">
          {/* Add Appointment Button */}
          <Button 
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-6"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="w-5 h-5 ml-2" />
            حجز موعد جديد
          </Button>

          {/* Calendar */}
          <Card className="p-4 dark:bg-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold dark:text-white">{getMonthName(currentMonth, currentYear)}</h3>
              <div className="flex gap-1">
                <button 
                  onClick={handlePreviousMonth}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <ChevronRight className="w-4 h-4 dark:text-white" />
                </button>
                <button 
                  onClick={handleNextMonth}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 dark:text-white" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'].map((day) => (
                <div key={day} className="text-center text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {day}
                </div>
              ))}
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }
                
                const isCurrentDay = day === todayDate && currentMonth === today.getMonth() && currentYear === today.getFullYear();
                const isSelected = day === selectedDate && currentMonth === today.getMonth() && currentYear === today.getFullYear();
                
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(day)}
                    className={`aspect-square rounded-full text-sm transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold scale-110'
                        : isCurrentDay
                        ? 'bg-gray-900 dark:bg-gray-700 text-white font-bold'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Quick Booking */}
          <Card className="p-4 dark:bg-gray-800">
            <h3 className="font-bold mb-4 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              تصفية حسب الأخصائية
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  checked={selectedSpecialist === 'الكل'}
                  onChange={() => setSelectedSpecialist('الكل')}
                  className="w-4 h-4 text-pink-600"
                />
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold bg-gradient-to-r from-pink-500 to-purple-600">
                  الكل
                </div>
                <span className="text-sm dark:text-white">جميع الأخصائيات</span>
              </label>
              
              {uniqueSpecialists.map((specialist, index) => {
                const colors = ['bg-pink-400', 'bg-blue-400', 'bg-purple-400', 'bg-green-400', 'bg-yellow-400', 'bg-red-400'];
                const colorClass = colors[index % colors.length];
                
                // Extract name and position if available
                const parts = specialist.split(' - ');
                const name = parts[0] || specialist;
                const position = parts[1] || '';
                
                return (
                  <label key={index} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      checked={selectedSpecialist === specialist}
                      onChange={() => setSelectedSpecialist(specialist)}
                      className="w-4 h-4 text-pink-600"
                    />
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${colorClass}`}>
                      {name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <span className="text-sm dark:text-white block">{name}</span>
                      {position && <span className="text-xs text-gray-500 dark:text-gray-400">{position}</span>}
                    </div>
                  </label>
                );
              })}
            </div>
          </Card>

          {/* Performance Card */}
          <Card className="bg-gradient-to-br from-pink-500 to-purple-600 text-white p-6">
            <h3 className="text-lg font-bold mb-2">تحليلات الأداء</h3>
            <p className="text-sm text-white/80 mb-4">
              لقد حققت {appointments.length} موعد هذا الأسبوع
            </p>
            <Button variant="secondary" className="w-full bg-white text-pink-600 hover:bg-gray-100" onClick={() => setShowDetailedReport(true)}>
              عرض التقرير المفصل
            </Button>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="p-4 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">مواعيد اليوم</p>
                  <h3 className="text-3xl font-bold dark:text-white">{todayCount}</h3>
                  <p className="text-xs text-green-600 mt-1">+16%</p>
                </div>
                <div className="bg-pink-100 dark:bg-pink-900 p-3 rounded-xl">
                  <CalendarIcon className="w-6 h-6 text-pink-600" />
                </div>
              </div>
            </Card>
            <Card className="p-4 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">قيد التأكيد</p>
                  <h3 className="text-3xl font-bold dark:text-white">
                    {pendingCount}
                  </h3>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-xl">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>
            <Card className="p-4 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">المواعيد المؤكدة</p>
                  <h3 className="text-3xl font-bold dark:text-white">
                    {upcomingCount}
                  </h3>
                </div>
                <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-xl">
                  <Check className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex gap-3 mb-6">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-6 py-2 rounded-xl font-medium transition-all ${
                  activeFilter === filter
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Appointments List */}
          <Card className="p-6 dark:bg-gray-800">
            {/* Search for Completed Appointments */}
            {activeFilter === 'منتهي' && (
              <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-700">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Search className="w-5 h-5 text-purple-600" />
                  بحث في المواعيد المنتهية
                </h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      نوع البحث
                    </label>
                    <select
                      value={completedSearchType}
                      onChange={(e) => setCompletedSearchType(e.target.value as any)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                    >
                      <option value="all">الكل</option>
                      <option value="customer">بحث باسم العميل</option>
                      <option value="day">بحث باليوم</option>
                      <option value="month">بحث بالشهر</option>
                      <option value="year">بحث بالسنة</option>
                    </select>
                  </div>

                  {completedSearchType === 'customer' ? (
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        اسم العميل
                      </label>
                      <input
                        type="text"
                        value={completedSearchTerm}
                        onChange={(e) => setCompletedSearchTerm(e.target.value)}
                        placeholder="ابحث عن عميل..."
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                      />
                    </div>
                  ) : completedSearchType !== 'all' ? (
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        {completedSearchType === 'day' ? 'اختر اليوم' : completedSearchType === 'month' ? 'اختر الشهر' : 'اختر السنة'}
                      </label>
                      <input
                        type={completedSearchType === 'day' ? 'date' : completedSearchType === 'month' ? 'month' : 'number'}
                        value={completedSearchDate}
                        onChange={(e) => setCompletedSearchDate(e.target.value)}
                        placeholder={completedSearchType === 'year' ? 'مثال: 2024' : ''}
                        min={completedSearchType === 'year' ? '2020' : undefined}
                        max={completedSearchType === 'year' ? '2030' : undefined}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                      />
                    </div>
                  ) : null}
                </div>

                {(completedSearchTerm || completedSearchDate) && (
                  <div className="flex items-center justify-between bg-white dark:bg-gray-700 p-3 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      النتائج: {activeFilter === 'منتهي' ? getFilteredCompletedAppointments().length : 0} موعد
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCompletedSearchTerm('');
                        setCompletedSearchDate('');
                        setCompletedSearchType('all');
                      }}
                      className="text-pink-600 hover:text-pink-700"
                    >
                      مسح البحث
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold dark:text-white">{getMonthName(currentMonth, currentYear)}</h2>
            </div>

            <div className="space-y-4">
              {(activeFilter === 'منتهي' ? getFilteredCompletedAppointments() : filteredAppointments).map((appointment) => {
                // Check if appointment is today
                const aptIsToday = isToday(appointment.date);
                const aptDate = appointment.date ? new Date(appointment.date) : null;
                const dateText = aptIsToday ? 'اليوم' : aptDate ? aptDate.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' }) : '';
                
                return (
                  <div
                    key={appointment.id}
                    className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl p-4 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-gray-900 dark:text-white">{appointment.customer}</h4>
                            {appointment.vip && (
                              <span className="bg-pink-500 text-white text-xs px-2 py-0.5 rounded-full">VIP</span>
                            )}
                            {aptIsToday && (
                              <span className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                                {dateText}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{appointment.service}</p>
                          {!aptIsToday && dateText && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{dateText}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm text-gray-500 dark:text-gray-400">الحالة: {appointment.status}</p>
                          <p className="text-sm font-medium dark:text-white">{appointment.time}</p>
                        </div>

                        <div className="flex gap-2">
                        {appointment.status === 'مؤكد' ? (
                          <button 
                            onClick={() => handleStartService(appointment.id)}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                          >
                            <Play className="w-4 h-4" />
                            بدء الخدمة
                          </button>
                        ) : appointment.status === 'جاري التنفيذ' ? (
                          <button 
                            onClick={() => handleCompleteService(appointment.id)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            تم الانتهاء
                          </button>
                        ) : appointment.status === 'مكتمل' ? (
                          <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            منتهي
                          </div>
                        ) : appointment.status === 'موعد القادم' ? (
                          <button className="bg-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
                            موعد القادم
                          </button>
                        ) : appointment.status === 'ملغي' ? (
                          <button className="bg-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium">
                            إعادة حجز
                          </button>
                        ) : (
                          <button className="bg-yellow-400 text-white px-4 py-2 rounded-lg text-sm font-medium">
                            قيد الانتظار
                          </button>
                        )}
                        <button
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
                          onClick={() => handleEditAppointment(appointment)}
                        >
                          <Edit2 className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                        </button>
                        <button
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
                          onClick={() => deleteAppointment(appointment.id)}
                        >
                          <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Add Appointment Dialog */}
      <AddAppointmentDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
      />

      {/* Edit Appointment Dialog */}
      {editingAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditingAppointment(null)}>
          <Card className="w-[500px] p-6 dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold dark:text-white">تعديل الموعد</h3>
              <button onClick={() => setEditingAppointment(null)}>
                <X className="w-5 h-5 dark:text-white" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">اسم العميل</label>
                <input
                  type="text"
                  value={editingAppointment.customer}
                  onChange={(e) => setEditingAppointment({ ...editingAppointment, customer: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">الخدمة</label>
                <input
                  type="text"
                  value={editingAppointment.service}
                  onChange={(e) => setEditingAppointment({ ...editingAppointment, service: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">الوقت</label>
                <input
                  type="text"
                  value={editingAppointment.time}
                  onChange={(e) => setEditingAppointment({ ...editingAppointment, time: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">الحالة</label>
                <select
                  value={editingAppointment.status}
                  onChange={(e) => setEditingAppointment({ ...editingAppointment, status: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                >
                  <option value="قيد الانتظار">قيد الانتظار</option>
                  <option value="مؤكد">مؤكد</option>
                  <option value="موعد القادم">موعد القادم</option>
                  <option value="ملغي">ملغي</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEditingAppointment(null)}
              >
                إلغاء
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                onClick={handleSaveEdit}
              >
                حفظ التعديلات
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Detailed Report Dialog */}
      {showDetailedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDetailedReport(false)}>
          <Card className="w-[800px] p-6 dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold dark:text-white">تقرير مفصل بالأداء</h3>
              <button onClick={() => setShowDetailedReport(false)}>
                <X className="w-5 h-5 dark:text-white" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">مواعيد اليوم</p>
                      <h3 className="text-3xl font-bold dark:text-white">{todayCount}</h3>
                      <p className="text-xs text-green-600 mt-1">+16%</p>
                    </div>
                    <div className="bg-pink-100 dark:bg-pink-900 p-3 rounded-xl">
                      <CalendarIcon className="w-6 h-6 text-pink-600" />
                    </div>
                  </div>
                </Card>
                <Card className="p-4 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">قيد التأكيد</p>
                      <h3 className="text-3xl font-bold dark:text-white">
                        {pendingCount}
                      </h3>
                    </div>
                    <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-xl">
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </Card>
                <Card className="p-4 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">المواعيد المؤكدة</p>
                      <h3 className="text-3xl font-bold dark:text-white">
                        {upcomingCount}
                      </h3>
                    </div>
                    <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-xl">
                      <Check className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">المواعيد الملغاة</p>
                      <h3 className="text-3xl font-bold dark:text-white">{cancelledCount}</h3>
                      <p className="text-xs text-red-600 mt-1">-5%</p>
                    </div>
                    <div className="bg-red-100 dark:bg-red-900 p-3 rounded-xl">
                      <X className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </Card>
                <Card className="p-4 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">المواعيد المنتهية</p>
                      <h3 className="text-3xl font-bold dark:text-white">
                        {completedCount}
                      </h3>
                    </div>
                    <div className="bg-green-100 dark:bg-green-900 p-3 rounded-xl">
                      <Check className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}