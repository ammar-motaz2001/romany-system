import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  ArrowRight, DollarSign, TrendingUp, AlertTriangle, FileText, 
  Clock, Calendar, Printer, CheckCircle, XCircle, Award, Plus, X
} from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import Header from '@/app/components/Header';
import { useApp } from '@/app/context/AppContext';

export default function EmployeePayrollDetailsPage() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const { employees, attendanceRecords, sales, bonuses, addBonus, deleteBonus, currentUser } = useApp();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Bonus Dialog State
  const [showBonusDialog, setShowBonusDialog] = useState(false);
  const [bonusAmount, setBonusAmount] = useState('');
  const [bonusReason, setBonusReason] = useState('');

  const arabicMonths = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  // Find employee
  const employee = employees.find(e => e.id === employeeId);

  // Redirect if employee not found
  useEffect(() => {
    if (!employee) {
      navigate('/payroll');
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
    if (record.workHours) {
      const hours = parseFloat(record.workHours);
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
  let salaryNote = '';
  
  if (employee.salaryType === 'يومي') {
    baseSalary = (employee.baseSalary / employee.workDays) * presentDays;
    salaryNote = `راتب يومي: ${employee.baseSalary} ÷ ${employee.workDays} يوم × ${presentDays} يوم حضور`;
  } else if (employee.salaryType === 'بالساعة') {
    baseSalary = employee.hourlyRate * totalWorkHours;
    salaryNote = `راتب بالساعة: ${employee.hourlyRate} ج.م × ${totalWorkHours.toFixed(2)} ساعة`;
  } else {
    salaryNote = `راتب شهري ثابت`;
  }

  // Calculate deductions with details
  const latePenaltyPerMinute = employee.latePenaltyPerMinute || 0;
  const absencePenaltyPerDay = employee.absencePenaltyPerDay || 0;
  const customDeductions = employee.customDeductions || 0;
  
  const lateDeduction = totalLateMinutes * latePenaltyPerMinute;
  const absentDeduction = absentDays * absencePenaltyPerDay;

  // Calculate overtime pay (bonus)
  const hourlyRate = employee.salaryType === 'بالساعة' 
    ? employee.hourlyRate 
    : employee.baseSalary / (employee.workDays * employee.shiftHours);
  const overtimePay = overtimeHours * hourlyRate * 1.5;

  // Calculate advances (السلف)
  const advances = monthAttendance.reduce((acc, record) => {
    return acc + (record.advance ? parseFloat(record.advance) : 0);
  }, 0);

  // Get advance details
  const advanceDetails = monthAttendance
    .filter(record => record.advance && parseFloat(record.advance) > 0)
    .map(record => ({
      date: new Date(record.date).toLocaleDateString('ar-EG'),
      amount: parseFloat(record.advance)
    }));

  // Final calculations
  const totalEarnings = baseSalary + commission + overtimePay;
  const totalDeductions = lateDeduction + absentDeduction + customDeductions + advances;
  const netSalary = totalEarnings - totalDeductions;

  // Print payslip function
  const printPayslip = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) {
      alert('يرجى السماح بفتح النوافذ المنبثقة للطباعة');
      return;
    }

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>كشف راتب - ${employee.name}</title>
          <meta charset="UTF-8">
          <style>
            @media print {
              @page { margin: 1cm; }
              body { margin: 0; }
            }
            body { 
              font-family: Arial, sans-serif; 
              padding: 30px;
              direction: rtl;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 4px solid #e91e63;
              padding-bottom: 20px;
            }
            .header h1 {
              color: #e91e63;
              margin: 0 0 10px 0;
              font-size: 32px;
            }
            .header h2 {
              color: #666;
              margin: 0;
              font-size: 20px;
              font-weight: normal;
            }
            .info-section {
              margin-bottom: 25px;
              padding: 15px;
              background: #f8f9fa;
              border-radius: 8px;
              border-right: 4px solid #9c27b0;
            }
            .info-section h3 {
              color: #9c27b0;
              margin: 0 0 10px 0;
              font-size: 18px;
            }
            .info-row {
              margin: 8px 0;
              font-size: 14px;
            }
            .info-row strong {
              color: #333;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              padding: 12px;
              text-align: right;
              border-bottom: 1px solid #ddd;
            }
            th {
              background-color: #f8f9fa;
              font-weight: bold;
              color: #333;
            }
            .section-title {
              background-color: #9c27b0;
              color: white;
              padding: 10px;
              font-weight: bold;
              font-size: 16px;
            }
            .earnings-section {
              background-color: #e8f5e9;
            }
            .deductions-section {
              background-color: #ffebee;
            }
            .total-row {
              background-color: #e91e63;
              color: white;
              font-size: 20px;
              font-weight: bold;
            }
            .sub-note {
              color: #666;
              font-size: 12px;
              font-style: italic;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #ddd;
              color: #666;
              font-size: 12px;
            }
            .highlight-box {
              background: #fff3e0;
              border: 2px solid #ff9800;
              padding: 10px;
              margin: 15px 0;
              border-radius: 5px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🌸 Beauty Center 🌸</h1>
            <h2>كشف راتب شهر ${arabicMonths[selectedMonth]} ${selectedYear}</h2>
          </div>

          <div class="info-section">
            <h3>📋 معلومات الموظف</h3>
            <div class="info-row"><strong>الاسم:</strong> ${employee.name}</div>
            <div class="info-row"><strong>الوظيفة:</strong> ${employee.position}</div>
            <div class="info-row"><strong>نوع الراتب:</strong> ${employee.salaryType}</div>
            <div class="info-row"><strong>تاريخ الإصدار:</strong> ${new Date().toLocaleDateString('ar-EG')}</div>
          </div>

          <table>
            <tr class="section-title">
              <th colspan="2">📊 ملخص الحضور</th>
            </tr>
            <tr>
              <td>عدد أيام الحضور</td>
              <td><strong>${presentDays}</strong> يوم</td>
            </tr>
            <tr>
              <td>عدد أيام التأخير</td>
              <td><strong>${lateDays}</strong> يوم <span class="sub-note">(${totalLateMinutes} دقيقة إجمالي)</span></td>
            </tr>
            <tr>
              <td>عدد أيام الغياب</td>
              <td><strong>${absentDays}</strong> يوم</td>
            </tr>
            <tr>
              <td>عدد أيام الإجازات</td>
              <td><strong>${leaveDays}</strong> يوم</td>
            </tr>
            <tr>
              <td>إجمالي ساعات العمل</td>
              <td><strong>${totalWorkHours.toFixed(2)}</strong> ساعة</td>
            </tr>
            <tr>
              <td>ساعات الإضافي (بونص)</td>
              <td><strong>${overtimeHours.toFixed(2)}</strong> ساعة</td>
            </tr>
          </table>

          <table>
            <tr class="section-title earnings-section">
              <th colspan="2">💰 الأرباح والمستحقات</th>
            </tr>
            <tr>
              <td>
                الراتب الأساسي
                <div class="sub-note">${salaryNote}</div>
              </td>
              <td><strong>${baseSalary.toFixed(2)}</strong> ج.م</td>
            </tr>
            ${commission > 0 ? `
            <tr>
              <td>
                العمولات (بونص)
                <div class="sub-note">${employee.commission}% من مبيعات ${totalSalesAmount.toFixed(2)} ج.م</div>
              </td>
              <td style="color: #2e7d32;"><strong>+${commission.toFixed(2)}</strong> ج.م</td>
            </tr>
            ` : ''}
            ${overtimePay > 0 ? `
            <tr>
              <td>
                ساعات إضافي (بونص)
                <div class="sub-note">${overtimeHours.toFixed(2)} ساعة × ${(hourlyRate * 1.5).toFixed(2)} ج.م</div>
              </td>
              <td style="color: #2e7d32;"><strong>+${overtimePay.toFixed(2)}</strong> ج.م</td>
            </tr>
            ` : ''}
            <tr style="background: #e8f5e9;">
              <td><strong>إجمالي الأرباح</strong></td>
              <td><strong style="color: #2e7d32; font-size: 18px;">${totalEarnings.toFixed(2)} ج.م</strong></td>
            </tr>
          </table>

          <table>
            <tr class="section-title deductions-section">
              <th colspan="2">⚠️ الخصومات</th>
            </tr>
            ${lateDeduction > 0 ? `
            <tr>
              <td>
                خصم التأخير
                <div class="sub-note">السبب: تأخر ${totalLateMinutes} دقيقة × ${latePenaltyPerMinute} ج.م للديقة</div>
              </td>
              <td style="color: #c62828;"><strong>-${lateDeduction.toFixed(2)}</strong> ج.م</td>
            </tr>
            ` : '<tr><td>خصم التأخير</td><td style="color: #4caf50;">لا يوجد ✓</td></tr>'}
            ${absentDeduction > 0 ? `
            <tr>
              <td>
                خصم الغياب
                <div class="sub-note">السبب: غياب ${absentDays} يوم × ${absencePenaltyPerDay} ج.م لليوم</div>
              </td>
              <td style="color: #c62828;"><strong>-${absentDeduction.toFixed(2)}</strong> ج.م</td>
            </tr>
            ` : '<tr><td>خصم الغياب</td><td style="color: #4caf50;">لا يوجد ✓</td></tr>'}
            ${customDeductions > 0 ? `
            <tr>
              <td>
                خصومات أخرى
                <div class="sub-note">السبب: خصومات إدارية أو عهدة</div>
              </td>
              <td style="color: #c62828;"><strong>-${customDeductions.toFixed(2)}</strong> ج.م</td>
            </tr>
            ` : '<tr><td>خصومات أخرى</td><td style="color: #4caf50;">لا يوجد ✓</td></tr>'}
            ${advances > 0 ? `
            <tr>
              <td>
                السلف المسحوبة
                <div class="sub-note">السبب: سلف نقدية خلال الشهر (${advanceDetails.length} مرة)</div>
                ${advanceDetails.map(adv => `<div class="sub-note">• ${adv.date}: ${adv.amount} ج.م</div>`).join('')}
              </td>
              <td style="color: #c62828;"><strong>-${advances.toFixed(2)}</strong> ج.م</td>
            </tr>
            ` : '<tr><td>السلف المسحوبة</td><td style="color: #4caf50;">لا يوجد ✓</td></tr>'}
            <tr style="background: #ffebee;">
              <td><strong>إجمالي الخصومات</strong></td>
              <td><strong style="color: #c62828; font-size: 18px;">${totalDeductions.toFixed(2)} ج.م</strong></td>
            </tr>
          </table>

          ${(commission > 0 || overtimePay > 0) ? `
          <div class="highlight-box">
            <strong>🎉 مبروك! حصلت على بونص هذا الشهر:</strong>
            <ul style="margin: 10px 0;">
              ${commission > 0 ? `<li>عمولة مبيعات: <strong>${commission.toFixed(2)} ج.م</strong></li>` : ''}
              ${overtimePay > 0 ? `<li>ساعات إضافي: <strong>${overtimePay.toFixed(2)} ج.م</strong></li>` : ''}
              <li>إجمالي البونص: <strong>${(commission + overtimePay).toFixed(2)} ج.م</strong></li>
            </ul>
          </div>
          ` : ''}

          <table>
            <tr class="total-row">
              <td>💵 صافي الراتب المستحق</td>
              <td>${netSalary.toFixed(2)} ج.م</td>
            </tr>
          </table>

          <div class="footer">
            <p><strong>ملاحظات:</strong></p>
            <p>• هذا الكشف صادر بتاريخ ${new Date().toLocaleDateString('ar-EG')} ويعتبر وثيقة رسمية</p>
            <p>• يرجى مراجعة المحاسبة في حالة وجود أي استفسار</p>
            <p>• تم إصدار هذا الكشف بواسطة نظام Beauty Center</p>
            <p style="margin-top: 20px;">______________________</p>
            <p>توقيع المحاسب</p>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  // Deduction items for display
  const deductionItems = [
    {
      show: lateDeduction > 0,
      title: 'خصم التأخير',
      reason: `تأخر ${totalLateMinutes} دقيقة`,
      calculation: `${totalLateMinutes} دقيقة × ${latePenaltyPerMinute} ج.م`,
      amount: lateDeduction,
      icon: '⏰'
    },
    {
      show: absentDeduction > 0,
      title: 'خصم الغياب',
      reason: `غياب ${absentDays} يوم`,
      calculation: `${absentDays} يوم × ${absencePenaltyPerDay} ج.م`,
      amount: absentDeduction,
      icon: '❌'
    },
    {
      show: customDeductions > 0,
      title: 'خصومات أخرى',
      reason: 'خصومات إدارية أو عهدة',
      calculation: 'مبلغ ثابت',
      amount: customDeductions,
      icon: '📝'
    },
    {
      show: advances > 0,
      title: 'السلف المسحوبة',
      reason: `${advanceDetails.length} سلفة خلال الشهر`,
      calculation: advanceDetails.map(a => `${a.date}: ${a.amount} ج.م`).join('\n'),
      amount: advances,
      icon: '💸'
    }
  ];

  // Bonus items
  const bonusItems = [
    {
      show: commission > 0,
      title: 'عمولة المبيعات',
      details: `${employee.commission}% من ${totalSalesAmount.toFixed(2)} ج.م`,
      amount: commission,
      icon: '🎯'
    },
    {
      show: overtimePay > 0,
      title: 'ساعات إضافي',
      details: `${overtimeHours.toFixed(2)} ساعة × ${(hourlyRate * 1.5).toFixed(2)} ج.م`,
      amount: overtimePay,
      icon: '⏱️'
    }
  ];

  // Get manual bonuses for this employee and month
  const manualBonuses = bonuses.filter(b => 
    b.employeeId === employee.id &&
    b.month === selectedMonth &&
    b.year === selectedYear
  );

  const totalManualBonuses = manualBonuses.reduce((acc, b) => acc + b.amount, 0);

  // Recalculate totals with manual bonuses
  const totalEarningsWithBonuses = totalEarnings + totalManualBonuses;
  const netSalaryWithBonuses = totalEarningsWithBonuses - totalDeductions;

  // Handle adding bonus
  const handleAddBonus = () => {
    if (!bonusAmount || parseFloat(bonusAmount) <= 0) {
      alert('يرجى إدخال قيمة البونص');
      return;
    }
    if (!bonusReason.trim()) {
      alert('يرجى إدخال سبب البونص');
      return;
    }

    addBonus({
      employeeId: employee.id,
      employeeName: employee.name,
      amount: parseFloat(bonusAmount),
      reason: bonusReason,
      month: selectedMonth,
      year: selectedYear,
      date: new Date().toISOString(),
      addedBy: currentUser?.name || 'admin',
    });

    setBonusAmount('');
    setBonusReason('');
    setShowBonusDialog(false);
  };

  // Handle delete bonus
  const handleDeleteBonus = (bonusId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا البونص؟')) {
      deleteBonus(bonusId);
    }
  };

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900" dir="rtl">
      <Header title="كشف راتب الموظف" />

      <div className="p-4 sm:p-6 lg:p-8">
        {/* Back Button & Print */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/payroll')}
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            رجوع للرواتب
          </Button>

          <Button
            onClick={printPayslip}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white"
          >
            <Printer className="w-4 h-4 ml-2" />
            طباعة كشف الراتب
          </Button>
        </div>

        {/* Employee Header */}
        <Card className="p-6 mb-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{employee.name}</h2>
              <p className="text-lg text-gray-600">{employee.position}</p>
              <p className="text-sm text-purple-600 mt-1">نوع الراتب: {employee.salaryType}</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-500 text-white px-6 py-3 rounded-xl">
                <p className="text-xs mb-1">الشهر</p>
                <p className="text-lg font-bold">{arabicMonths[selectedMonth]} {selectedYear}</p>
              </div>
            </div>
          </div>

          {/* Month Selector */}
          <div className="flex items-center gap-3 pt-4 border-t border-purple-200">
            <label className="text-sm font-medium text-gray-700">عرض شهر آخر:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white"
            >
              {arabicMonths.map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white"
            >
              {[2024, 2025, 2026, 2027].map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 text-center">
            <div className="text-2xl mb-2">✅</div>
            <h3 className="text-2xl font-bold text-gray-900">{presentDays}</h3>
            <p className="text-sm text-gray-600">أيام حضور</p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 text-center">
            <div className="text-2xl mb-2">⏰</div>
            <h3 className="text-2xl font-bold text-gray-900">{lateDays}</h3>
            <p className="text-sm text-gray-600">أيام تأخير</p>
            <p className="text-xs text-orange-600 mt-1">({totalLateMinutes} دقيقة)</p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-red-50 to-pink-50 text-center">
            <div className="text-2xl mb-2">❌</div>
            <h3 className="text-2xl font-bold text-gray-900">{absentDays}</h3>
            <p className="text-sm text-gray-600">أيام غياب</p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 text-center">
            <div className="text-2xl mb-2">⏱️</div>
            <h3 className="text-2xl font-bold text-gray-900">{totalWorkHours.toFixed(1)}</h3>
            <p className="text-sm text-gray-600">ساعات عمل</p>
          </Card>
        </div>

        {/* Earnings Section */}
        <Card className="p-6 mb-6 border-2 border-green-200">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-700">
            <TrendingUp className="w-6 h-6" />
            💰 الأرباح والمستحقات
          </h3>

          <div className="space-y-3 bg-green-50 p-4 rounded-lg">
            {/* Base Salary */}
            <div className="bg-white p-4 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-lg text-gray-900">الراتب الأساسي</p>
                  <p className="text-sm text-gray-600">{salaryNote}</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{baseSalary.toFixed(2)} ج.م</p>
              </div>
            </div>

            {/* Bonuses */}
            {bonusItems.filter(item => item.show).map((item, index) => (
              <div key={index} className="bg-green-100 p-4 rounded-lg border-2 border-green-300">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-lg text-green-800 flex items-center gap-2">
                      <span>{item.icon}</span>
                      {item.title} (بونص)
                    </p>
                    <p className="text-sm text-green-700 mt-1">{item.details}</p>
                  </div>
                  <p className="text-2xl font-bold text-green-600">+{item.amount.toFixed(2)} ج.م</p>
                </div>
              </div>
            ))}

            {/* Total Earnings */}
            <div className="bg-green-600 text-white p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <p className="text-lg font-bold">إجمالي الأرباح</p>
                <p className="text-3xl font-black">{totalEarnings.toFixed(2)} ج.م</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Bonus Highlight */}
        {(commission > 0 || overtimePay > 0) && (
          <Card className="p-6 mb-6 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-400">
            <div className="flex items-start gap-4">
              <Award className="w-12 h-12 text-yellow-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-yellow-800 mb-2">🎉 مبروك! حصلت على بونص هذا الشهر</h3>
                <div className="space-y-1">
                  {commission > 0 && (
                    <p className="text-yellow-700">✨ عمولة مبيعات: <strong>{commission.toFixed(2)} ج.م</strong></p>
                  )}
                  {overtimePay > 0 && (
                    <p className="text-yellow-700">✨ ساعات إضافي: <strong>{overtimePay.toFixed(2)} ج.م</strong></p>
                  )}
                  <p className="text-lg font-bold text-yellow-900 mt-2">
                    إجمالي البونص: {(commission + overtimePay).toFixed(2)} ج.م 🎊
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Manual Bonuses Section */}
        <Card className="p-6 mb-6 border-2 border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2 text-purple-700">
              <Award className="w-6 h-6" />
              🎁 بونصات يدوية إضافية
            </h3>
            <Button
              onClick={() => setShowBonusDialog(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-600 text-white"
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة بونص
            </Button>
          </div>

          {manualBonuses.length > 0 ? (
            <div className="space-y-3 bg-purple-50 p-4 rounded-lg">
              {manualBonuses.map((bonus) => (
                <div key={bonus.id} className="bg-white p-4 rounded-lg border-r-4 border-purple-400">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-bold text-lg text-gray-900">🎁 {bonus.reason}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        أضيف بواسطة: {bonus.addedBy}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        التاريخ: {new Date(bonus.date).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-2xl font-bold text-purple-600">+{bonus.amount.toFixed(2)} ج.م</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBonus(bonus.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {totalManualBonuses > 0 && (
                <div className="bg-purple-600 text-white p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <p className="text-lg font-bold">إجمالي البونصات اليدوية</p>
                    <p className="text-3xl font-black">+{totalManualBonuses.toFixed(2)} ج.م</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-purple-50 p-6 rounded-lg text-center">
              <Award className="w-16 h-16 text-purple-300 mx-auto mb-3" />
              <p className="text-gray-600">لا توجد بونصات يدوية لهذا الشهر</p>
              <p className="text-sm text-gray-500 mt-1">يمكنك إضافة بونص إضافي من الزر أعلاه</p>
            </div>
          )}
        </Card>

        {/* Bonus Dialog */}
        {showBonusDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowBonusDialog(false)}>
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">إضافة بونص يدوي</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBonusDialog(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    قيمة البونص (ج.م)
                  </label>
                  <input
                    type="number"
                    value={bonusAmount}
                    onChange={(e) => setBonusAmount(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="أدخل قيمة البونص"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    سبب البونص
                  </label>
                  <textarea
                    value={bonusReason}
                    onChange={(e) => setBonusReason(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    placeholder="اكتب سبب البونص (مثال: تميز في الأداء، مبيعات إضافية، إلخ)"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleAddBonus}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white"
                  >
                    إضافة البونص
                  </Button>
                  <Button
                    onClick={() => setShowBonusDialog(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Deductions Section */}
        <Card className="p-6 mb-6 border-2 border-red-200">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-6 h-6" />
            ⚠️ الخصومات
          </h3>

          {deductionItems.filter(item => item.show).length > 0 ? (
            <div className="space-y-3 bg-red-50 p-4 rounded-lg">
              {deductionItems.filter(item => item.show).map((item, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border-r-4 border-red-400">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-bold text-lg text-gray-900 flex items-center gap-2">
                        <span>{item.icon}</span>
                        {item.title}
                      </p>
                      <p className="text-sm text-red-600 mt-1">
                        <strong>السبب:</strong> {item.reason}
                      </p>
                      <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">
                        <strong>الحساب:</strong> {item.calculation}
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-red-600">-{item.amount.toFixed(2)} ج.م</p>
                  </div>
                </div>
              ))}

              {/* Total Deductions */}
              <div className="bg-red-600 text-white p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <p className="text-lg font-bold">إجمالي الخصومات</p>
                  <p className="text-3xl font-black">{totalDeductions.toFixed(2)} ج.م</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 p-6 rounded-lg text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
              <p className="text-lg font-bold text-green-700">ممتاز! لا توجد خصومات هذا الشهر</p>
              <p className="text-sm text-green-600 mt-1">استمر في الأاء الجيد 🌟</p>
            </div>
          )}
        </Card>

        {/* Net Salary - FINAL */}
        <Card className="p-8 bg-gradient-to-r from-pink-500 to-purple-600 text-white border-4 border-purple-400">
          <div className="text-center">
            <p className="text-pink-100 text-lg mb-3">💵 صافي الراتب المستحق</p>
            <h1 className="text-6xl md:text-7xl font-black mb-3">{netSalaryWithBonuses.toFixed(2)}</h1>
            <p className="text-2xl text-pink-100">جنيه مصري</p>
            
            <div className="mt-6 pt-6 border-t-2 border-pink-300">
              <p className="text-sm text-pink-100">
                الأرباح: {totalEarnings.toFixed(2)} ج.م
                {totalManualBonuses > 0 && ` + بونصات: ${totalManualBonuses.toFixed(2)} ج.م`}
                {' '}- الخصومات: {totalDeductions.toFixed(2)} ج.م
              </p>
            </div>
          </div>
        </Card>

        {/* Print Again Button */}
        <div className="mt-6 text-center">
          <Button
            onClick={printPayslip}
            size="lg"
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-lg px-8"
          >
            <Printer className="w-5 h-5 ml-2" />
            طباعة كشف الراتب
          </Button>
        </div>
      </div>
    </div>
  );
}