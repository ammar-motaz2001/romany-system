import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  ArrowRight, User, Phone, Mail, Briefcase, Calendar, DollarSign,
  TrendingUp, Clock, AlertTriangle, FileText, Download, Edit
} from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import Header from '@/app/components/Header';
import { useApp } from '@/app/context/AppContext';
import { formatTimeTo12h, getDisplayWorkHours, formatWorkHoursFromDecimal } from '@/utils/attendanceUtils';

export default function EmployeeDetailsPage() {
  const { id: employeeId } = useParams();
  const navigate = useNavigate();
  const { employees, attendanceRecords, sales } = useApp();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const arabicMonths = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  // Find employee
  const employee = employees.find(e => e.id === employeeId);

  // Redirect if employee not found
  useEffect(() => {
    if (!employee) {
      navigate('/employees');
    }
  }, [employee, navigate]);

  if (!employee) {
    return null;
  }

  // Filter attendance for selected month
  const monthAttendance = attendanceRecords.filter(record => {
    const recordDate = new Date(record.date);
    return (
      record.employeeId === employee.id &&
      recordDate.getMonth() === selectedMonth &&
      recordDate.getFullYear() === selectedYear
    );
  });

  // Calculate attendance stats
  const presentDays = monthAttendance.filter(r => r.status === 'حاضر' || r.status === 'متأخر').length;
  const lateDays = monthAttendance.filter(r => r.status === 'متأخر').length;
  const absentDays = monthAttendance.filter(r => r.status === 'غائب').length;
  const leaveDays = monthAttendance.filter(r => r.status === 'إجازة').length;

  // Calculate work hours
  let totalWorkHours = 0;
  let overtimeHours = 0;
  let totalLateMinutes = 0;

  monthAttendance.forEach(record => {
    const hours = getDisplayWorkHours(record) ?? 0;
    if (hours > 0) {
      totalWorkHours += hours;
      if (hours > employee.shiftHours) {
        overtimeHours += hours - employee.shiftHours;
      }
    }
    if (record.status === 'متأخر' && record.lateMinutes) {
      totalLateMinutes += parseInt(record.lateMinutes);
    }
  });

  // Calculate commission from sales
  let commission = 0;
  let totalSalesAmount = 0;
  if (employee.commission > 0) {
    const employeeSales = sales.filter(sale => {
      const saleDate = new Date(sale.date || sale.createdAt);
      return (
        sale.specialist === employee.name &&
        saleDate.getMonth() === selectedMonth &&
        saleDate.getFullYear() === selectedYear
      );
    });
    
    totalSalesAmount = employeeSales.reduce((acc, sale) => acc + (sale.total || sale.amount), 0);
    commission = (totalSalesAmount * employee.commission) / 100;
  }

  // Calculate salary
  let baseSalary = employee.baseSalary;
  if (employee.salaryType === 'يومي') {
    baseSalary = (employee.baseSalary / employee.workDays) * presentDays;
  } else if (employee.salaryType === 'بالساعة') {
    baseSalary = employee.hourlyRate * totalWorkHours;
  }

  // Calculate deductions
  const latePenaltyPerMinute = Number(employee?.latePenaltyPerMinute) || 0;
  const absencePenaltyPerDay = employee.absencePenaltyPerDay || 0;
  const customDeductions = employee.customDeductions || 0;
  
  const lateDeduction = totalLateMinutes * latePenaltyPerMinute;
  const absentDeduction = absentDays * absencePenaltyPerDay;

  // Calculate overtime pay
  const hourlyRate = employee.salaryType === 'بالساعة' 
    ? employee.hourlyRate 
    : employee.baseSalary / (employee.workDays * employee.shiftHours);
  const overtimePay = overtimeHours * hourlyRate * 1.5;

  // Calculate advances (السلف)
  const advances = monthAttendance.reduce((acc, record) => {
    return acc + (record.advance ? parseFloat(record.advance) : 0);
  }, 0);

  // Final calculations
  const totalEarnings = baseSalary + commission + overtimePay;
  const totalDeductions = lateDeduction + absentDeduction + customDeductions + advances;
  const netSalary = totalEarnings - totalDeductions;

  // Print payslip
  const printPayslip = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html dir="rtl">
          <head>
            <title>كشف راتب - ${employee.name}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                padding: 40px;
                direction: rtl;
              }
              .header {
                text-align: center;
                margin-bottom: 40px;
                border-bottom: 3px solid #e91e63;
                padding-bottom: 20px;
              }
              .header h1 {
                color: #e91e63;
                margin: 0;
              }
              .info-section {
                margin-bottom: 30px;
                padding: 20px;
                background: #f8f9fa;
                border-radius: 10px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
              }
              th, td {
                padding: 15px;
                text-align: right;
                border-bottom: 1px solid #ddd;
              }
              th {
                background-color: #f8f9fa;
                font-weight: bold;
              }
              .total-row {
                background-color: #e91e63;
                color: white;
                font-size: 20px;
                font-weight: bold;
              }
              .section-title {
                background-color: #9c27b0;
                color: white;
                padding: 10px;
                font-weight: bold;
              }
              .footer {
                text-align: center;
                margin-top: 50px;
                padding-top: 20px;
                border-top: 2px solid #ddd;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Beauty Center</h1>
              <h2>كشف راتب شهر ${arabicMonths[selectedMonth]} ${selectedYear}</h2>
            </div>

            <div class="info-section">
              <h3>معلومات الموظف</h3>
              <p><strong>الاسم:</strong> ${employee.name}</p>
              <p><strong>الوظيفة:</strong> ${employee.position}</p>
              <p><strong>رقم الهاتف:</strong> ${employee.phone}</p>
              <p><strong>نوع الراتب:</strong> ${employee.salaryType}</p>
              <p><strong>تاريخ الإصدار:</strong> ${new Date().toLocaleDateString('ar-EG')}</p>
            </div>

            <table>
              <tr class="section-title">
                <th colspan="2">ملخص الحضور</th>
              </tr>
              <tr>
                <td>عدد أيام الحضور</td>
                <td>${presentDays} يوم</td>
              </tr>
              <tr>
                <td>عدد أيام التأخير</td>
                <td>${lateDays} يوم (${totalLateMinutes} دقيقة)</td>
              </tr>
              <tr>
                <td>عدد أيام الغياب</td>
                <td>${absentDays} يوم</td>
              </tr>
              <tr>
                <td>عدد أيام الإجازات</td>
                <td>${leaveDays} يوم</td>
              </tr>
              <tr>
                <td>إجمالي ساعات العمل</td>
                <td>${totalWorkHours.toFixed(2)} ساعة</td>
              </tr>
              <tr>
                <td>ساعات الإضافي</td>
                <td>${overtimeHours.toFixed(2)} ساعة</td>
              </tr>

              <tr class="section-title">
                <th colspan="2">الأرباح</th>
              </tr>
              <tr>
                <td>الراتب الأساسي</td>
                <td>${baseSalary.toFixed(2)} ج.م</td>
              </tr>
              <tr>
                <td>العمولات (${employee.commission}% من ${totalSalesAmount.toFixed(2)} ج.م)</td>
                <td>+${commission.toFixed(2)} ج.م</td>
              </tr>
              <tr>
                <td>ساعات الإضافي</td>
                <td>+${overtimePay.toFixed(2)} ج.م</td>
              </tr>
              <tr>
                <td><strong>إجمالي الأرباح</strong></td>
                <td><strong>${totalEarnings.toFixed(2)} ج.م</strong></td>
              </tr>

              <tr class="section-title">
                <th colspan="2">الخصومات</th>
              </tr>
              <tr>
                <td>خصم التأخير (${totalLateMinutes} دقيقة × ${latePenaltyPerMinute} ج.م)</td>
                <td>-${lateDeduction.toFixed(2)} ج.م</td>
              </tr>
              <tr>
                <td>خصم الغياب (${absentDays} يوم × ${absencePenaltyPerDay} ج.م)</td>
                <td>-${absentDeduction.toFixed(2)} ج.م</td>
              </tr>
              <tr>
                <td>خصومات أخرى</td>
                <td>-${customDeductions.toFixed(2)} ج.م</td>
              </tr>
              <tr>
                <td>السلف المسحوبة</td>
                <td>-${advances.toFixed(2)} ج.م</td>
              </tr>
              <tr>
                <td><strong>إجمالي الخصومات</strong></td>
                <td><strong>${totalDeductions.toFixed(2)} ج.م</strong></td>
              </tr>

              <tr class="total-row">
                <td>صافي الراتب</td>
                <td>${netSalary.toFixed(2)} ج.م</td>
              </tr>
            </table>

            <div class="footer">
              <p>تم إصدار هذا الكشف بواسطة Beauty Center</p>
              <p>${new Date().toLocaleDateString('ar-EG')}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900" dir="rtl">
      <Header title={`تفاصيل الموظف: ${employee.name}`} />

      <div className="p-4 sm:p-6 lg:p-8">
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          رجوع
        </Button>

        {/* Employee Info Card */}
        <Card className="p-6 mb-6 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="bg-purple-500 p-3 rounded-xl">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">الاسم</p>
                <p className="text-lg font-bold text-gray-900">{employee.name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-blue-500 p-3 rounded-xl">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">الوظيفة</p>
                <p className="text-lg font-bold text-gray-900">{employee.position}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-green-500 p-3 rounded-xl">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">رقم الهاتف</p>
                <p className="text-lg font-bold text-gray-900">{employee.phone}</p>
              </div>
            </div>

            {employee.email && (
              <div className="flex items-start gap-3">
                <div className="bg-orange-500 p-3 rounded-xl">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">البريد الإلكتروني</p>
                  <p className="text-lg font-bold text-gray-900">{employee.email}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className="bg-pink-500 p-3 rounded-xl">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">تاريخ التعيين</p>
                <p className="text-lg font-bold text-gray-900">
                  {new Date(employee.hireDate).toLocaleDateString('ar-EG')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-teal-500 p-3 rounded-xl">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">نوع الراتب</p>
                <p className="text-lg font-bold text-gray-900">{employee.salaryType}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 flex flex-wrap gap-3">
            <Button
              onClick={() => navigate(`/employees`)}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Edit className="w-4 h-4 ml-2" />
              تعديل البيانات
            </Button>
            <Button
              onClick={printPayslip}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white"
            >
              <FileText className="w-4 h-4 ml-2" />
              طباعة كشف الراتب
            </Button>
          </div>
        </Card>

        {/* Month/Year Selector */}
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">اختر الشهر:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-4 py-2 rounded-lg border border-gray-300"
            >
              {arabicMonths.map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 rounded-lg border border-gray-300"
            >
              {[2024, 2025, 2026, 2027].map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </Card>

        {/* Attendance Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50">
            <div className="text-center">
              <div className="text-3xl mb-2">✓</div>
              <h3 className="text-3xl font-bold text-gray-900">{presentDays}</h3>
              <p className="text-sm text-gray-600">أيام حضور</p>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-orange-50 to-amber-50">
            <div className="text-center">
              <div className="text-3xl mb-2">⏰</div>
              <h3 className="text-3xl font-bold text-gray-900">{lateDays}</h3>
              <p className="text-sm text-gray-600">أيام تأخير</p>
              <p className="text-xs text-orange-600 mt-1">({totalLateMinutes} دقيقة)</p>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-red-50 to-pink-50">
            <div className="text-center">
              <div className="text-3xl mb-2">✗</div>
              <h3 className="text-3xl font-bold text-gray-900">{absentDays}</h3>
              <p className="text-sm text-gray-600">أيام غياب</p>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
            <div className="text-center">
              <div className="text-3xl mb-2">🏖️</div>
              <h3 className="text-3xl font-bold text-gray-900">{leaveDays}</h3>
              <p className="text-sm text-gray-600">أيام إجازة</p>
            </div>
          </Card>
        </div>

        {/* Work Hours */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">إجمالي ساعات العمل</p>
                <h3 className="text-4xl font-bold text-gray-900">{totalWorkHours.toFixed(2)}</h3>
                <p className="text-xs text-gray-500 mt-1">ساعة</p>
              </div>
              <Clock className="w-16 h-16 text-purple-400" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">ساعات الإضافي</p>
                <h3 className="text-4xl font-bold text-gray-900">{overtimeHours.toFixed(2)}</h3>
                <p className="text-xs text-gray-500 mt-1">ساعة</p>
              </div>
              <TrendingUp className="w-16 h-16 text-blue-400" />
            </div>
          </Card>
        </div>

        {/* Salary Breakdown */}
        <Card className="p-6 mb-6">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-pink-600" />
            تفاصيل الراتب - {arabicMonths[selectedMonth]} {selectedYear}
          </h3>

          <div className="space-y-6">
            {/* Earnings */}
            <div>
              <h4 className="font-bold text-lg mb-3 text-green-700 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                الأرباح
              </h4>
              <div className="space-y-2 bg-green-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">الراتب الأساسي</span>
                  <span className="font-bold text-lg">{baseSalary.toFixed(2)} ج.م</span>
                </div>
                {commission > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">
                      العمولات ({employee.commission}% من {totalSalesAmount.toFixed(2)} ج.م)
                    </span>
                    <span className="font-bold text-lg text-green-600">+{commission.toFixed(2)} ج.م</span>
                  </div>
                )}
                {overtimePay > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">
                      ساعات إضافي ({overtimeHours.toFixed(2)} ساعة)
                    </span>
                    <span className="font-bold text-lg text-green-600">+{overtimePay.toFixed(2)} ج.م</span>
                  </div>
                )}
                <div className="pt-3 border-t-2 border-green-200 flex justify-between items-center">
                  <span className="font-bold text-gray-900">إجمالي الأرباح</span>
                  <span className="font-bold text-2xl text-green-600">{totalEarnings.toFixed(2)} ج.م</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div>
              <h4 className="font-bold text-lg mb-3 text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                الخصومات
              </h4>
              <div className="space-y-2 bg-red-50 p-4 rounded-lg">
                {lateDeduction > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">
                      خصم التأخير ({totalLateMinutes} دقيقة × {latePenaltyPerMinute} ج.م)
                    </span>
                    <span className="font-bold text-lg text-red-600">-{lateDeduction.toFixed(2)} ج.م</span>
                  </div>
                )}
                {absentDeduction > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">
                      خصم الغياب ({absentDays} يوم × {absencePenaltyPerDay} ج.م)
                    </span>
                    <span className="font-bold text-lg text-red-600">-{absentDeduction.toFixed(2)} ج.م</span>
                  </div>
                )}
                {customDeductions > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">خصومات أخرى</span>
                    <span className="font-bold text-lg text-red-600">-{customDeductions.toFixed(2)} ج.م</span>
                  </div>
                )}
                {advances > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">السلف المسحوبة</span>
                    <span className="font-bold text-lg text-red-600">-{advances.toFixed(2)} ج.م</span>
                  </div>
                )}
                <div className="pt-3 border-t-2 border-red-200 flex justify-between items-center">
                  <span className="font-bold text-gray-900">إجمالي الخصومات</span>
                  <span className="font-bold text-2xl text-red-600">{totalDeductions.toFixed(2)} ج.م</span>
                </div>
              </div>
            </div>

            {/* Net Salary */}
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-6 rounded-xl text-white">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-pink-100 mb-2">صافي الراتب</p>
                  <h2 className="text-5xl font-black">{netSalary.toFixed(2)}</h2>
                  <p className="text-pink-100 mt-2">جنيه مصري</p>
                </div>
                <DollarSign className="w-24 h-24 text-pink-200 opacity-50" />
              </div>
            </div>
          </div>
        </Card>

        {/* Attendance History */}
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">سجل الحضور - {arabicMonths[selectedMonth]} {selectedYear}</h3>
          
          {monthAttendance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-right py-3 px-4 text-sm font-bold text-gray-700">التاريخ</th>
                    <th className="text-right py-3 px-4 text-sm font-bold text-gray-700">الحالة</th>
                    <th className="text-right py-3 px-4 text-sm font-bold text-gray-700">وقت الدخول</th>
                    <th className="text-right py-3 px-4 text-sm font-bold text-gray-700">وقت الخروج</th>
                    <th className="text-right py-3 px-4 text-sm font-bold text-gray-700">ساعات العمل</th>
                    <th className="text-right py-3 px-4 text-sm font-bold text-gray-700">التأخير</th>
                    <th className="text-right py-3 px-4 text-sm font-bold text-gray-700">سلفة</th>
                  </tr>
                </thead>
                <tbody>
                  {monthAttendance.map((record, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {new Date(record.date).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          record.status === 'حاضر' ? 'bg-green-100 text-green-700' :
                          record.status === 'متأخر' ? 'bg-orange-100 text-orange-700' :
                          record.status === 'غائب' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{formatTimeTo12h(record.checkIn)}</td>
                      <td className="py-3 px-4 text-gray-600">{formatTimeTo12h(record.checkOut)}</td>
                      <td className="py-3 px-4 text-gray-900 font-medium">
                        {(() => {
                          const hours = getDisplayWorkHours(record);
                          return hours != null ? `${formatWorkHoursFromDecimal(hours)} ساعة` : '-';
                        })()}
                      </td>
                      <td className="py-3 px-4 text-orange-600">
                        {record.lateMinutes ? `${record.lateMinutes} دقيقة` : '-'}
                      </td>
                      <td className="py-3 px-4 text-red-600 font-medium">
                        {record.advance ? `${record.advance} ج.م` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>لا توجد سجلات حضور لهذا الشهر</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}