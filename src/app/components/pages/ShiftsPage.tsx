import { useState, useMemo, useEffect } from 'react';
import { Calendar, Clock, DollarSign, User, CheckCircle, XCircle, TrendingUp, Eye, Printer, Search, History } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import Header from '@/app/components/Header';
import { useApp } from '@/app/context/AppContext';
import ShiftReportModal from '@/app/components/pages/ShiftReportModal';

// Shifts Management Page

export default function ShiftsPage() {
  const { shifts, fetchShifts, closeShift } = useApp();
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'closed'>('all');

  // Fetch shifts from GET /api/shifts when الورديات page is opened
  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);
  const [dateFilter, setDateFilter] = useState<string>('');
  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  // Filter shifts (جميع الورديات — date and status only)
  const filteredShifts = useMemo(() => {
    let result = [...shifts];

    if (dateFilter) {
      result = result.filter(shift => {
        const shiftDate = new Date(shift.startTime).toISOString().split('T')[0];
        return shiftDate === dateFilter;
      });
    }

    if (filterStatus !== 'all') {
      result = result.filter(shift => shift.status === filterStatus);
    }

    return result;
  }, [shifts, filterStatus, dateFilter]);

  // Sort shifts by date (newest first)
  const sortedShifts = [...filteredShifts].sort((a, b) => 
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );

  // Statistics based on filtered shifts
  const stats = useMemo(() => {
    const totalSales = filteredShifts.reduce((sum, shift) => sum + shift.totalSales, 0);
    const totalShifts = filteredShifts.length;
    const openShifts = filteredShifts.filter(s => s.status === 'open').length;
    
    return { totalSales, totalShifts, openShifts };
  }, [filteredShifts]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ar-EG', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const calculateDuration = (start: string, end: string) => {
    if (!end) return '---';
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = Math.abs(endDate.getTime() - startDate.getTime());
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours === 0) {
      return `${minutes} دقيقة`;
    }
    
    return `${hours} ساعة و ${minutes} دقيقة`;
  };

  const handleViewReport = (shift: any) => {
    setSelectedShift(shift);
    setShowReportModal(true);
  };

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900" dir="rtl">
      <Header title="الورديات" />

      <div className="p-6">
        {/* Filters Card */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date Filter */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="pl-10"
                placeholder="البحث بالتاريخ"
              />
            </div>

            {/* جميع الورديات — fixed label (no dropdown) */}
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium">
              <History className="w-5 h-5" />
              <span>جميع الورديات</span>
            </div>
          </div>
        </Card>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            onClick={() => setFilterStatus('all')}
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            className={filterStatus === 'all' ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white' : ''}
          >
            الكل ({filteredShifts.length})
          </Button>
          <Button
            onClick={() => setFilterStatus('open')}
            variant={filterStatus === 'open' ? 'default' : 'outline'}
            className={filterStatus === 'open' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' : ''}
          >
            مفتوحة ({filteredShifts.filter(s => s.status === 'open').length})
          </Button>
          <Button
            onClick={() => setFilterStatus('closed')}
            variant={filterStatus === 'closed' ? 'default' : 'outline'}
            className={filterStatus === 'closed' ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white' : ''}
          >
            مغلقة ({filteredShifts.filter(s => s.status === 'closed').length})
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي المبيعات</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.totalSales.toFixed(2)} ج.م
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">عدد الورديات</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalShifts}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">الورديات المفتوحة</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.openShifts}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-600" />
            </div>
          </Card>
        </div>

        {/* Shifts List */}
        <div className="space-y-4">
          {sortedShifts.length === 0 ? (
            <Card className="p-12 text-center">
              <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">لا توجد ورديات</p>
            </Card>
          ) : (
            sortedShifts.map((shift) => (
              <Card key={shift.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full ${
                      shift.status === 'open' 
                        ? 'bg-green-100 dark:bg-green-900/30' 
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      {shift.status === 'open' ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <XCircle className="w-6 h-6 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatDate(shift.startTime)}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          shift.status === 'open'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          {shift.status === 'open' ? 'مفتوحة' : 'مغلقة'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {shift.cashier?.trim() || 'كاشير'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTime(shift.startTime)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {shift.status === 'closed' && (
                    <div className="text-left">
                      <p className="text-sm text-gray-600 dark:text-gray-400">وقت الإغلاق</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatTime(shift.endTime)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">إجمالي المبيعات</p>
                    <p className="text-lg font-bold text-green-600">
                      {Number(shift.totalSales ?? 0).toFixed(2)} ج.م
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">نقدي</p>
                    <p className="text-lg font-bold text-blue-600">
                      {Number(shift.salesDetails?.cash ?? 0).toFixed(2)} ج.م
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">بطاقة</p>
                    <p className="text-lg font-bold text-purple-600">
                      {Number(shift.salesDetails?.card ?? 0).toFixed(2)} ج.م
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">InstaPay</p>
                    <p className="text-lg font-bold text-pink-600">
                      {Number(shift.salesDetails?.instapay ?? 0).toFixed(2)} ج.م
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {shift.status === 'closed' && (
                    <div className="flex items-center justify-between text-sm mb-3">
                      <span className="text-gray-600 dark:text-gray-400">المدة الزمنية:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {calculateDuration(shift.startTime, shift.endTime)}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => handleViewReport(shift)}
                      className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                      size="sm"
                    >
                      <Eye className="ml-2 w-4 h-4" />
                      عرض التقرير
                    </Button>
                    {shift.status === 'open' ? (
                      <Button
                        onClick={() => closeShift(shift.id)}
                        variant="destructive"
                        size="sm"
                      >
                        <XCircle className="ml-2 w-4 h-4" />
                        إغلاق الوردية
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          setSelectedShift(shift);
                          setShowReportModal(true);
                          setTimeout(() => window.print(), 500);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <Printer className="ml-2 w-4 h-4" />
                        طباعة
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Shift Report Modal */}
      {showReportModal && selectedShift && (
        <ShiftReportModal
          shift={selectedShift}
          onClose={() => {
            setShowReportModal(false);
            setSelectedShift(null);
          }}
        />
      )}
    </div>
  );
}