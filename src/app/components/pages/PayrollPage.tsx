import { useState, useEffect } from 'react';
import { Download, TrendingUp, TrendingDown, DollarSign, Calculator, ChevronDown, ChevronUp, Eye, Loader2 } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import Header from '@/app/components/Header';
import { useApp } from '@/app/context/AppContext';
import { useNavigate } from 'react-router';
import { generateTablePDF } from '@/utils/pdfExportArabic';
import { toast } from 'sonner';
import { payrollService, type PayslipResponse } from '@/services/payroll.service';
import { getLateMinutesForRecord, getDisplayWorkHours } from '@/utils/attendanceUtils';

export interface PayrollRow {
  employeeId: string;
  employeeName: string;
  position: string;
  baseSalary: string;
  commission: string;
  overtimePay: string;
  totalAllowances: string;
  totalDeductions: string;
  netSalary: string;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  leaveDays: number;
  totalWorkHours: string;
  overtimeHours: string;
}

export default function PayrollPage() {
  const { employees, attendanceRecords, sales, systemSettings } = useApp();
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [payrollRows, setPayrollRows] = useState<PayrollRow[]>([]);
  const [loadingPayroll, setLoadingPayroll] = useState(true);

  const arabicMonths = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  // Same formula as كشف راتب الموظف (EmployeePayrollDetailsPage) so الصافي matches
  const calculatePayroll = (employee: any) => {
    const monthAttendance = attendanceRecords.filter(record => {
      const recordDate = new Date(record.date);
      return (
        record.employeeId === employee.id &&
        recordDate.getMonth() === selectedMonth &&
        recordDate.getFullYear() === selectedYear
      );
    });

    const presentDays = monthAttendance.filter(r => r.status === 'حاضر' || r.status === 'تأخير' || r.status === 'متأخر').length;
    const lateDays = monthAttendance.filter(r => r.status === 'تأخير' || r.status === 'متأخر').length;
    const absentDays = monthAttendance.filter(r => r.status === 'غائب').length;
    const leaveDays = monthAttendance.filter(r => r.status === 'إجازة').length;

    let totalWorkHours = 0;
    let totalLateMinutes = 0;
    let overtimeHours = 0;

    const workStartTime = systemSettings?.workingHours?.start;
    monthAttendance.forEach(record => {
      const lateMins = getLateMinutesForRecord(
        { checkIn: record.checkIn, lateMinutes: record.lateMinutes, status: record.status },
        workStartTime
      );
      totalLateMinutes += lateMins;
      const lateHours = lateMins / 60;
      const hours = getDisplayWorkHours(record) ?? 0;
      if (hours > 0) {
        totalWorkHours += hours;
        const effectiveHours = Math.max(0, hours - lateHours);
        if (effectiveHours > employee.shiftHours) {
          overtimeHours += effectiveHours - employee.shiftHours;
        }
      }
    });

    let commission = 0;
    if (employee.commission > 0) {
      const employeeSales = sales.filter(sale => {
        const saleDate = new Date(sale.date || sale.createdAt);
        return (
          sale.specialist === employee.name &&
          saleDate.getMonth() === selectedMonth &&
          saleDate.getFullYear() === selectedYear
        );
      });
      const totalSalesAmount = employeeSales.reduce((acc, sale) => acc + (sale.total || sale.amount), 0);
      commission = (totalSalesAmount * employee.commission) / 100;
    }

    const effectiveTotalWorkHours = Math.max(0, totalWorkHours - totalLateMinutes / 60);
    let baseSalary = employee.baseSalary;
    if (employee.salaryType === 'يومي') {
      baseSalary = (employee.baseSalary / employee.workDays) * presentDays;
    } else if (employee.salaryType === 'بالساعة') {
      baseSalary = (employee.hourlyRate ?? 0) * effectiveTotalWorkHours;
    }

    const hourlyRate =
      employee.salaryType === 'بالساعة'
        ? (employee.hourlyRate ?? 0)
        : employee.baseSalary / (employee.workDays * employee.shiftHours);
    const overtimePay = overtimeHours * hourlyRate * 1.5;

    const latePenaltyPerMinute = Number(employee?.latePenaltyPerMinute) || 0;
    const absencePenaltyPerDay = employee.absencePenaltyPerDay || 0;
    const customDeductions = employee.customDeductions ?? employee.otherDeductions ?? 0;
    const hourlyRateForLate =
      employee.salaryType === 'بالساعة'
        ? (employee.hourlyRate ?? 0)
        : employee.baseSalary / (employee.workDays * employee.shiftHours);
    const lateDeductionFromPenalty = totalLateMinutes * latePenaltyPerMinute;
    const lateDeductionFromUnpaid =
      latePenaltyPerMinute <= 0 && totalLateMinutes > 0
        ? (totalLateMinutes / 60) * hourlyRateForLate
        : 0;
    const lateDeduction = lateDeductionFromPenalty + lateDeductionFromUnpaid;
    const absentDeduction = absentDays * absencePenaltyPerDay;
    const advances = monthAttendance.reduce(
      (acc, record) => acc + (record.advance ? parseFloat(record.advance) : 0),
      0
    );
    const totalDeductions = lateDeduction + absentDeduction + customDeductions + advances;
    const totalEarnings = baseSalary + commission + overtimePay;
    const netSalary = totalEarnings - totalDeductions;
    const totalAllowances = (employee.allowances || 0) + (employee.bonus || 0);

    return {
      employeeId: employee.id,
      employeeName: employee.name,
      position: employee.position,
      baseSalary: baseSalary.toFixed(2),
      commission: commission.toFixed(2),
      overtimePay: overtimePay.toFixed(2),
      totalAllowances: totalAllowances.toFixed(2),
      totalDeductions: totalDeductions.toFixed(2),
      netSalary: netSalary.toFixed(2),
      presentDays,
      lateDays,
      absentDays,
      leaveDays,
      totalWorkHours: totalWorkHours.toFixed(2),
      overtimeHours: overtimeHours.toFixed(2),
    };
  };

  // Fetch payroll from same endpoint as كشف راتب الموظف (GET /employees/:id/payroll) – dynamic from API
  useEffect(() => {
    if (employees.length === 0) {
      setPayrollRows([]);
      setLoadingPayroll(false);
      return;
    }
    setLoadingPayroll(true);
    Promise.allSettled(
      employees.map(emp =>
        payrollService.getEmployeePayslip(emp.id, { month: selectedMonth, year: selectedYear })
      )
    )
      .then(results => {
        const rows: PayrollRow[] = results.map((result, i) => {
          const emp = employees[i];
          if (result.status === 'fulfilled' && result.value) {
            const api: PayslipResponse = result.value;
            const allowances =
              (api.totalEarnings ?? 0) - (api.baseSalary ?? 0) - (api.commission ?? 0) - (api.overtimePay ?? 0);
            const totalDeductionsFromFlow =
              (api.lateDeduction ?? 0) +
              (api.absentDeduction ?? 0) +
              (api.customDeductions ?? 0) +
              (api.advances ?? 0);
            const totalDeductions = totalDeductionsFromFlow > 0 ? totalDeductionsFromFlow : (api.totalDeductions ?? 0);
            return {
              employeeId: emp.id,
              employeeName: emp.name,
              position: emp.position ?? '',
              baseSalary: String(api.baseSalary ?? 0),
              commission: String(api.commission ?? 0),
              overtimePay: String(api.overtimePay ?? 0),
              totalAllowances: String(Math.max(0, allowances)),
              totalDeductions: String(totalDeductions),
              netSalary: String(api.netSalary ?? 0),
              presentDays: api.presentDays ?? 0,
              lateDays: api.lateDays ?? 0,
              absentDays: api.absentDays ?? 0,
              leaveDays: api.leaveDays ?? 0,
              totalWorkHours: String(api.totalWorkHours ?? 0),
              overtimeHours: String(api.overtimeHours ?? 0),
            };
          }
          const local = calculatePayroll(emp);
          return {
            employeeId: local.employeeId,
            employeeName: local.employeeName,
            position: local.position,
            baseSalary: local.baseSalary,
            commission: local.commission,
            overtimePay: local.overtimePay,
            totalAllowances: local.totalAllowances,
            totalDeductions: local.totalDeductions,
            netSalary: local.netSalary,
            presentDays: local.presentDays,
            lateDays: local.lateDays,
            absentDays: local.absentDays,
            leaveDays: local.leaveDays,
            totalWorkHours: local.totalWorkHours,
            overtimeHours: local.overtimeHours,
          };
        });
        setPayrollRows(rows);
      })
      .catch(() => {
        const fallback = employees.map(emp => {
          const p = calculatePayroll(emp);
          return {
            employeeId: p.employeeId,
            employeeName: p.employeeName,
            position: p.position,
            baseSalary: p.baseSalary,
            commission: p.commission,
            overtimePay: p.overtimePay,
            totalAllowances: p.totalAllowances,
            totalDeductions: p.totalDeductions,
            netSalary: p.netSalary,
            presentDays: p.presentDays,
            lateDays: p.lateDays,
            absentDays: p.absentDays,
            leaveDays: p.leaveDays,
            totalWorkHours: p.totalWorkHours,
            overtimeHours: p.overtimeHours,
          };
        });
        setPayrollRows(fallback);
      })
      .finally(() => setLoadingPayroll(false));
  }, [employees, selectedMonth, selectedYear, attendanceRecords, sales]);

  const payrollData = payrollRows;

  const totalBaseSalary = payrollData.reduce((acc, p) => acc + parseFloat(p.baseSalary), 0);
  const totalCommission = payrollData.reduce((acc, p) => acc + parseFloat(p.commission), 0);
  const totalOvertimePay = payrollData.reduce((acc, p) => acc + parseFloat(p.overtimePay), 0);
  const totalAllowances = payrollData.reduce((acc, p) => acc + parseFloat(p.totalAllowances), 0);
  const totalNetSalary = payrollData.reduce((acc, p) => acc + parseFloat(p.netSalary), 0);
  const totalDeductions = payrollData.reduce((acc, p) => acc + parseFloat(p.totalDeductions), 0);

  const handleExport = () => {
    try {
      const columns = [
        { header: 'الموظف', dataKey: 'employeeName' },
        { header: 'الوظيفة', dataKey: 'position' },
        { header: 'الراتب', dataKey: 'baseSalary' },
        { header: 'العمولة', dataKey: 'commission' },
        { header: 'الإضافي', dataKey: 'overtimePay' },
        { header: 'الخصومات', dataKey: 'totalDeductions' },
        { header: 'الصافي', dataKey: 'netSalary' },
      ];

      const data = payrollData.map(record => ({
        employeeName: record.employeeName,
        position: record.position,
        baseSalary: `${record.baseSalary} ج.م`,
        commission: `${record.commission} ج.م`,
        overtimePay: `${record.overtimePay} ج.م`,
        totalDeductions: `${record.totalDeductions} ج.م`,
        netSalary: `${record.netSalary} ج.م`,
      }));

      generateTablePDF({
        title: 'تقرير الرواتب',
        subtitle: `إجمالي: ${totalNetSalary.toFixed(2)} ج.م`,
        columns,
        data,
        filename: `رواتب-${arabicMonths[selectedMonth]}-${selectedYear}.pdf`,
        shopName: systemSettings.shopName,
        dateRange: `${arabicMonths[selectedMonth]} ${selectedYear}`,
      });

      toast.success('تم تصدير التقرير بنجاح');
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('حدث خطأ أثناء التصدير');
    }
  };

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900" dir="rtl">
      <Header title="إدارة الرواتب" />
      <div className="p-4 sm:p-6 lg:p-8">
        {loadingPayroll && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" />
            <p className="text-sm text-blue-700 dark:text-blue-300">جاري تحميل بيانات الرواتب من كشف الراتب...</p>
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex flex-col items-center text-center">
              <DollarSign className="w-8 h-8 text-blue-500 mb-2" />
              <h3 className="text-2xl font-bold text-gray-900">{totalNetSalary.toFixed(0)}</h3>
              <p className="text-xs text-gray-600">إجمالي الرواتب</p>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="flex flex-col items-center text-center">
              <TrendingUp className="w-8 h-8 text-green-500 mb-2" />
              <h3 className="text-2xl font-bold text-gray-900">{(totalCommission + totalOvertimePay).toFixed(0)}</h3>
              <p className="text-xs text-gray-600">الإضافات</p>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
            <div className="flex flex-col items-center text-center">
              <TrendingDown className="w-8 h-8 text-red-500 mb-2" />
              <h3 className="text-2xl font-bold text-gray-900">{totalDeductions.toFixed(0)}</h3>
              <p className="text-xs text-gray-600">الخصومات</p>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <div className="flex flex-col items-center text-center">
              <Calculator className="w-8 h-8 text-purple-500 mb-2" />
              <h3 className="text-2xl font-bold text-gray-900">{employees.length}</h3>
              <p className="text-xs text-gray-600">عدد الموظفين</p>
            </div>
          </Card>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4">
              <select className="px-4 py-2 border rounded-md" value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
                {arabicMonths.map((m, i) => (<option key={i} value={i}>{m}</option>))}
              </select>
              <select className="px-4 py-2 border rounded-md" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
                {[2024, 2025, 2026, 2027].map(y => (<option key={y} value={y}>{y}</option>))}
              </select>
            </div>
            <Button variant="outline" onClick={handleExport} disabled={payrollData.length === 0} className="gap-2">
              <Download className="w-4 h-4" />
              تصدير PDF
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-right p-3 text-sm font-semibold">الموظف</th>
                  <th className="text-right p-3 text-sm font-semibold">الراتب</th>
                  <th className="text-right p-3 text-sm font-semibold">العمولة</th>
                  <th className="text-right p-3 text-sm font-semibold">الإضافي</th>
                  <th className="text-right p-3 text-sm font-semibold">الخصومات</th>
                  <th className="text-right p-3 text-sm font-semibold">الصافي</th>
                  <th className="text-center p-3 text-sm font-semibold">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {payrollData.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-500">لا توجد بيانات</td></tr>
                ) : (
                  payrollData.map((p, i) => (
                    <>
                      <tr key={p.employeeId} className="border-b hover:bg-gray-50">
                        <td className="p-3"><span className="font-medium">{p.employeeName}</span><br/><span className="text-sm text-gray-500">{p.position}</span></td>
                        <td className="p-3 font-medium text-blue-600">{parseFloat(p.baseSalary).toFixed(0)} ج.م</td>
                        <td className="p-3 font-medium text-green-600">{parseFloat(p.commission).toFixed(0)} ج.م</td>
                        <td className="p-3 font-medium text-green-600">{parseFloat(p.overtimePay).toFixed(0)} ج.م</td>
                        <td className="p-3 font-medium text-red-600">{parseFloat(p.totalDeductions).toFixed(0)} ج.م</td>
                        <td className="p-3 font-bold text-purple-600">{parseFloat(p.netSalary).toFixed(0)} ج.م</td>
                        <td className="p-3 text-center">
                          <Button variant="ghost" size="sm" onClick={() => setExpandedRow(expandedRow === i ? null : i)}>
                            {expandedRow === i ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/employees/${p.employeeId}/payroll`)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                      {expandedRow === i && (() => {
                        const emp = employees.find(e => e.id === p.employeeId);
                        const lateRate = Number(emp?.latePenaltyPerMinute) || 0;
                        return (
                        <tr className="bg-gray-50">
                          <td colSpan={7} className="p-4">
                            <div className="grid grid-cols-4 gap-4">
                              <div className="bg-white p-3 rounded border">
                                <p className="text-xs text-gray-500">الحضور</p>
                                <p className="text-lg font-bold text-green-600">{p.presentDays}</p>
                              </div>
                              <div className="bg-white p-3 rounded border">
                                <p className="text-xs text-gray-500">التأخير</p>
                                <p className="text-lg font-bold text-orange-600">{p.lateDays}</p>
                                {lateRate > 0 && (
                                  <p className="text-xs text-orange-600 mt-1">🕐 {lateRate} ج.م/دقيقة</p>
                                )}
                              </div>
                              <div className="bg-white p-3 rounded border">
                                <p className="text-xs text-gray-500">الغياب</p>
                                <p className="text-lg font-bold text-red-600">{p.absentDays}</p>
                              </div>
                              <div className="bg-white p-3 rounded border">
                                <p className="text-xs text-gray-500">ساعات العمل</p>
                                <p className="text-lg font-bold text-blue-600">{p.totalWorkHours}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                        );
                      })()}
                    </>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 bg-gray-50">
                  <td className="p-3 font-bold">الإجمالي</td>
                  <td className="p-3 font-bold text-blue-600">{totalBaseSalary.toFixed(0)} ج.م</td>
                  <td className="p-3 font-bold text-green-600">{totalCommission.toFixed(0)} ج.م</td>
                  <td className="p-3 font-bold text-green-600">{totalOvertimePay.toFixed(0)} ج.م</td>
                  <td className="p-3 font-bold text-red-600">{totalDeductions.toFixed(0)} ج.م</td>
                  <td className="p-3 font-bold text-purple-600">{totalNetSalary.toFixed(0)} ج.م</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}