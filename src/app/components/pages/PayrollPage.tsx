import { useState } from 'react';
import { Download, TrendingUp, TrendingDown, DollarSign, Calculator, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import Header from '@/app/components/Header';
import { useApp } from '@/app/context/AppContext';
import { useNavigate } from 'react-router';
import { generateTablePDF } from '@/utils/pdfExportArabic';
import { toast } from 'sonner';

export default function PayrollPage() {
  const { employees, attendanceRecords, sales, systemSettings } = useApp();
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const arabicMonths = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const calculatePayroll = (employee: any) => {
    const monthAttendance = attendanceRecords.filter(record => {
      const recordDate = new Date(record.date);
      return (
        record.employeeId === employee.id &&
        recordDate.getMonth() === selectedMonth &&
        recordDate.getFullYear() === selectedYear
      );
    });

    const presentDays = monthAttendance.filter(r => r.status === 'حاضر' || r.status === 'تأخير').length;
    const lateDays = monthAttendance.filter(r => r.status === 'تأخير').length;
    const absentDays = monthAttendance.filter(r => r.status === 'غائب').length;
    const leaveDays = monthAttendance.filter(r => r.status === 'إجازة').length;

    let totalWorkHours = 0;
    let overtimeHours = 0;

    monthAttendance.forEach(record => {
      if (record.workHours) {
        const hours = parseFloat(record.workHours);
        totalWorkHours += hours;
        
        if (hours > employee.shiftHours) {
          overtimeHours += hours - employee.shiftHours;
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

    let baseSalary = employee.baseSalary;

    if (employee.salaryType === 'يومي') {
      baseSalary = (employee.baseSalary / employee.workDays) * presentDays;
    } else if (employee.salaryType === 'بالساعة') {
      baseSalary = employee.hourlyRate * totalWorkHours;
    }

    const overtimePay = overtimeHours * (employee.hourlyRate || (employee.baseSalary / (employee.workDays * employee.shiftHours)));
    const totalAllowances = (employee.allowances || 0) + (employee.bonus || 0);
    const totalDeductions = (employee.otherDeductions || 0);
    const netSalary = baseSalary + commission + overtimePay + totalAllowances - totalDeductions;

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

  const payrollData = employees.map(emp => calculatePayroll(emp));

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
                      {expandedRow === i && (
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
                      )}
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