import { useState, useEffect } from 'react';
import { Download, Plus, Edit, Filter, Trash2, Clock, CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import Header from '@/app/components/Header';
import { useApp } from '@/app/context/AppContext';
import { generateTablePDF } from '@/utils/pdfExportArabic';
import { toast } from 'sonner';

/** Status options — backend enum only: حاضر, غائب, تأخير, إجازة (no extra values) */
const ATTENDANCE_STATUS_OPTIONS = [
  { value: 'حاضر', label: 'حاضر' },
  { value: 'غائب', label: 'غائب' },
  { value: 'تأخير', label: 'تأخير' },
  { value: 'إجازة', label: 'إجازة' },
] as const;

export default function AttendancePage() {
  const {
    employees,
    attendanceRecords,
    fetchAttendance,
    addAttendanceRecord,
    updateAttendanceRecord,
    deleteAttendanceRecord,
    systemSettings,
  } = useApp();
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Load attendance from GET /api/attendance when الحضور page is opened (real time from endpoint)
  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Form state
  const [formData, setFormData] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    checkIn: '',
    checkOut: '',
    status: 'حاضر',
    notes: '',
  });

  // Filter records
  const filteredRecords = attendanceRecords.filter(record => {
    const matchesStatus = filterStatus === 'الكل' || record.status === filterStatus;
    const matchesSearch = !searchQuery || 
      record.employeeName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = record.date === selectedDate;
    
    return matchesStatus && matchesSearch && matchesDate;
  });

  // Format workHours for display: number (decimal hours) -> "H:MM", or keep string as-is
  const formatWorkHoursDisplay = (val: string | number | undefined): string => {
    if (val == null || val === '') return '-';
    if (typeof val === 'number') {
      const h = Math.floor(val);
      const m = Math.round((val - h) * 60);
      return `${h}:${String(m).padStart(2, '0')}`;
    }
    return String(val);
  };

  // Today's statistics
  const todayRecords = attendanceRecords.filter(r => r.date === selectedDate);
  const presentCount = todayRecords.filter(r => r.status === 'حاضر' || r.status === 'تأخير').length;
  const lateCount = todayRecords.filter(r => r.status === 'تأخير').length;
  const absentCount = todayRecords.filter(r => r.status === 'غائب').length;
  const leaveCount = todayRecords.filter(r => r.status === 'إجازة').length;

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا السجل؟')) {
      deleteAttendanceRecord(id);
    }
  };

  const handleOpenAddDialog = () => {
    setFormData({
      employeeId: '',
      date: selectedDate,
      checkIn: '',
      checkOut: '',
      status: 'حاضر',
      notes: '',
    });
    setShowAddDialog(true);
  };

  const handleOpenEditDialog = (record: any) => {
    setFormData({
      employeeId: record.employeeId,
      date: record.date,
      checkIn: record.checkIn || '',
      checkOut: record.checkOut || '',
      status: record.status,
      notes: record.notes || '',
    });
    setEditingRecord(record);
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setEditingRecord(null);
    setFormData({
      employeeId: '',
      date: new Date().toISOString().split('T')[0],
      checkIn: '',
      checkOut: '',
      status: 'حاضر',
      notes: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.employeeId) {
      toast.error('يرجى اختيار الموظف');
      return;
    }

    const employee = employees.find(emp => emp.id === formData.employeeId);
    if (!employee) {
      toast.error('الموظف غير موجود');
      return;
    }

    // Backend expects workHours as Number (decimal hours). Compute from checkIn/checkOut.
    let workHoursNum: number | undefined;
    if (formData.checkIn && formData.checkOut) {
      const checkInTime = new Date(`2000-01-01T${formData.checkIn}`);
      const checkOutTime = new Date(`2000-01-01T${formData.checkOut}`);
      const diffMs = checkOutTime.getTime() - checkInTime.getTime();
      workHoursNum = diffMs / (1000 * 60 * 60); // decimal hours
    }

    const recordData = {
      employeeId: formData.employeeId,
      employeeName: employee.name,
      position: employee.position,
      image: employee.image,
      date: formData.date,
      checkIn: formData.checkIn,
      checkOut: formData.checkOut,
      workHours: workHoursNum,
      status: formData.status,
      notes: formData.notes,
    };

    if (editingRecord) {
      updateAttendanceRecord(editingRecord.id, recordData);
    } else {
      addAttendanceRecord(recordData);
    }

    handleCloseDialog();
  };

  const handleExport = () => {
    try {
      const columns = [
        { header: 'التاريخ', dataKey: 'date' },
        { header: 'الموظف', dataKey: 'employeeName' },
        { header: 'الوظيفة', dataKey: 'position' },
        { header: 'الحضور', dataKey: 'checkIn' },
        { header: 'الانصراف', dataKey: 'checkOut' },
        { header: 'ساعات العمل', dataKey: 'workHours' },
        { header: 'الحالة', dataKey: 'status' },
        { header: 'ملاحظات', dataKey: 'notes' },
      ];

      const data = filteredRecords.map(record => ({
        date: record.date,
        employeeName: record.employeeName,
        position: record.position,
        checkIn: record.checkIn || '-',
        checkOut: record.checkOut || '-',
        workHours: record.workHours || '-',
        status: record.status,
        notes: record.notes || '-',
      }));

      generateTablePDF({
        title: 'تقرير الحضور والانصراف',
        subtitle: `حاضرون: ${presentCount} | متأخرون: ${lateCount} | غائبون: ${absentCount} | إجازات: ${leaveCount}`,
        columns,
        data,
        filename: `حضور-${selectedDate}.pdf`,
        shopName: systemSettings.shopName,
        dateRange: new Date(selectedDate).toLocaleDateString('ar-EG'),
      });

      toast.success('تم تصدير التقرير بنجاح');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast.error('حدث خطأ أثناء تصدير التقرير');
    }
  };

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900" dir="rtl">
      <Header title="الحضور والانصراف" />

      <div className="p-4 sm:p-6 lg:p-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6">
          <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="flex flex-col items-center text-center">
              <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
              <h3 className="text-3xl font-bold text-gray-900 mb-1">{presentCount}</h3>
              <p className="text-sm text-gray-600">حاضرون</p>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
            <div className="flex flex-col items-center text-center">
              <Clock className="w-8 h-8 text-orange-500 mb-2" />
              <h3 className="text-3xl font-bold text-gray-900 mb-1">{lateCount}</h3>
              <p className="text-sm text-gray-600">متأخرون</p>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
            <div className="flex flex-col items-center text-center">
              <XCircle className="w-8 h-8 text-red-500 mb-2" />
              <h3 className="text-3xl font-bold text-gray-900 mb-1">{absentCount}</h3>
              <p className="text-sm text-gray-600">غائبون</p>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="w-8 h-8 text-blue-500 mb-2" />
              <h3 className="text-3xl font-bold text-gray-900 mb-1">{leaveCount}</h3>
              <p className="text-sm text-gray-600">إجازات</p>
            </div>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex-1 w-full lg:w-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="بحث عن موظف..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
                <select
                  className="px-3 py-2 border border-gray-300 rounded-md"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="الكل">جميع الحالات</option>
                  {ATTENDANCE_STATUS_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 w-full lg:w-auto">
              <Button
                onClick={handleExport}
                variant="outline"
                className="gap-2 flex-1 lg:flex-initial"
                disabled={filteredRecords.length === 0}
              >
                <Download className="w-4 h-4" />
                تصدير PDF
              </Button>
              <Button
                onClick={handleOpenAddDialog}
                className="gap-2 flex-1 lg:flex-initial"
              >
                <Plus className="w-4 h-4" />
                تسجيل جديد
              </Button>
            </div>
          </div>
        </Card>

        {/* Records Table */}
        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">الموظف</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">الوظيفة</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">الحضور</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">الانصراف</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">ساعات العمل</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">الحالة</th>
                  <th className="text-center p-3 text-sm font-semibold text-gray-700">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      لا توجد سجلات حضور لهذا التاريخ
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {record.image && (
                            <img
                              src={record.image}
                              alt={record.employeeName}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          )}
                          <span className="font-medium">{record.employeeName}</span>
                        </div>
                      </td>
                      <td className="p-3 text-gray-600">{record.position}</td>
                      <td className="p-3 font-mono text-sm">{record.checkIn || '-'}</td>
                      <td className="p-3 font-mono text-sm">{record.checkOut || '-'}</td>
                      <td className="p-3 font-medium">{formatWorkHoursDisplay(record.workHours)}</td>
                      <td className="p-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            record.status === 'حاضر'
                              ? 'bg-green-100 text-green-700'
                              : record.status === 'تأخير'
                              ? 'bg-orange-100 text-orange-700'
                              : record.status === 'غائب'
                              ? 'bg-red-100 text-red-700'
                              : record.status === 'إجازة'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditDialog(record)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(record.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      {(showAddDialog || editingRecord) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleCloseDialog}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {editingRecord ? 'تعديل سجل الحضور' : 'تسجيل حضور جديد'}
              </h2>
              <Button variant="ghost" size="sm" onClick={handleCloseDialog}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Employee Select */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الموظف <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    required
                  >
                    <option value="">اختر الموظف</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} - {employee.position}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    التاريخ <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                {/* Status (الحالة *) — same options as filter dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الحالة <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    required
                  >
                    {ATTENDANCE_STATUS_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Check In Time (optional — e.g. غائب has no times) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    وقت الدخول
                  </label>
                  <Input
                    type="time"
                    value={formData.checkIn}
                    onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                  />
                </div>

                {/* Check Out Time (optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    وقت الانصراف
                  </label>
                  <Input
                    type="time"
                    value={formData.checkOut}
                    onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                  />
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ملاحظات
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="أضف أي ملاحظات..."
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <Button type="submit" className="flex-1">
                  {editingRecord ? 'تحديث' : 'حفظ'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCloseDialog} className="flex-1">
                  إلغاء
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}