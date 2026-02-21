import { useState } from 'react';
import { Download, FileText, TrendingUp, ShoppingBag, Users, DollarSign } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import Header from '@/app/components/Header';
import { useApp } from '@/app/context/AppContext';
import { generateTablePDF } from '@/utils/pdfExportArabic';
import { formatTimeTo12h, getDisplayWorkHours, formatWorkHoursFromDecimal } from '@/utils/attendanceUtils';
import { toast } from 'sonner';

export default function ReportsPage() {
  const { sales, services, inventory, attendanceRecords, expenses, customers, systemSettings } = useApp();
  const [reportType, setReportType] = useState('تقرير المبيعات');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showReport, setShowReport] = useState(false);

  // Filter data based on date range
  const filteredSales = sales.filter(sale => {
    if (!fromDate && !toDate) return true;
    const saleDate = new Date(sale.date);
    const from = fromDate ? new Date(fromDate) : new Date(0);
    const to = toDate ? new Date(toDate) : new Date();
    to.setHours(23, 59, 59, 999); // Include the entire end date
    return saleDate >= from && saleDate <= to;
  });

  const filteredExpenses = expenses.filter(expense => {
    if (!fromDate && !toDate) return true;
    const expenseDate = new Date(expense.date);
    const from = fromDate ? new Date(fromDate) : new Date(0);
    const to = toDate ? new Date(toDate) : new Date();
    to.setHours(23, 59, 59, 999);
    return expenseDate >= from && expenseDate <= to;
  });

  const filteredAttendance = attendanceRecords.filter(record => {
    if (!fromDate && !toDate) return true;
    const recordDate = new Date(record.date);
    const from = fromDate ? new Date(fromDate) : new Date(0);
    const to = toDate ? new Date(toDate) : new Date();
    to.setHours(23, 59, 59, 999);
    return recordDate >= from && recordDate <= to;
  });

  // Calculate statistics based on report type
  const getStatistics = () => {
    if (reportType === 'تقرير المبيعات') {
      const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.amount, 0);
      const totalDiscount = filteredSales.reduce((sum, sale) => sum + (sale.discount || 0), 0);
      const avgInvoice = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;
      
      return {
        totalRevenue,
        totalDiscount,
        avgInvoice,
        count: filteredSales.length,
      };
    } else if (reportType === 'تقرير المصروفات') {
      const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      
      return {
        totalExpenses,
        count: filteredExpenses.length,
      };
    } else if (reportType === 'تقرير الحضور') {
      const present = filteredAttendance.filter(r => r.status === 'حاضر' || r.status === 'متأخر').length;
      const late = filteredAttendance.filter(r => r.status === 'متأخر').length;
      const absent = filteredAttendance.filter(r => r.status === 'غائب').length;
      
      return {
        present,
        late,
        absent,
        count: filteredAttendance.length,
      };
    } else if (reportType === 'تقرير المخزون') {
      const totalValue = inventory.reduce((sum, item) => sum + ((item.stock ?? item.quantity ?? 0) * item.price), 0);
      const minThresh = (item: { stock?: number; quantity?: number; minStock?: number; minQuantity?: number }) =>
        item.minStock ?? item.minQuantity ?? 0;
      const lowStock = inventory.filter(item =>
        (item.stock ?? item.quantity ?? 0) <= minThresh(item)
      ).length;

      return {
        totalValue,
        lowStock,
        count: inventory.length,
      };
    }
    
    return {};
  };

  const stats = getStatistics();

  const handleExport = () => {
    try {
      let columns: any[] = [];
      let data: any[] = [];
      let title = '';
      let subtitle = '';

      if (reportType === 'تقرير المبيعات') {
        title = 'تقرير المبيعات';
        subtitle = `إجمالي الإيرادات: ${stats.totalRevenue?.toFixed(2)} ج.م | عدد الفواتير: ${stats.count}`;
        
        columns = [
          { header: 'التاريخ', dataKey: 'date' },
          { header: 'العميل', dataKey: 'customer' },
          { header: 'المبلغ', dataKey: 'amount' },
          { header: 'الخصم', dataKey: 'discount' },
          { header: 'طريقة الدفع', dataKey: 'paymentMethod' },
        ];

        data = filteredSales.map(sale => ({
          date: new Date(sale.date).toLocaleDateString('ar-EG'),
          customer: sale.customer || 'عميل نقدي',
          amount: `${sale.amount.toFixed(2)} ج.م`,
          discount: `${(sale.discount || 0).toFixed(2)} ج.م`,
          paymentMethod: sale.paymentMethod || 'نقدي',
        }));
      } else if (reportType === 'تقرير المصروفات') {
        title = 'تقرير المصروفات';
        subtitle = `إجمالي المصروفات: ${stats.totalExpenses?.toFixed(2)} ج.م | عدد المصروفات: ${stats.count}`;
        
        columns = [
          { header: 'التاريخ', dataKey: 'date' },
          { header: 'الفئة', dataKey: 'category' },
          { header: 'الوصف', dataKey: 'description' },
          { header: 'المبلغ', dataKey: 'amount' },
          { header: 'طريقة الدفع', dataKey: 'paymentMethod' },
        ];

        data = filteredExpenses.map(expense => ({
          date: new Date(expense.date).toLocaleDateString('ar-EG'),
          category: expense.category,
          description: expense.description,
          amount: `${expense.amount.toFixed(2)} ج.م`,
          paymentMethod: expense.paymentMethod || 'نقدي',
        }));
      } else if (reportType === 'تقرير الحضور') {
        title = 'تقرير الحضور والانصراف';
        subtitle = `حاضرون: ${stats.present} | متأخرون: ${stats.late} | غائبون: ${stats.absent}`;
        
        columns = [
          { header: 'التاريخ', dataKey: 'date' },
          { header: 'الموظف', dataKey: 'employeeName' },
          { header: 'الحضور', dataKey: 'checkIn' },
          { header: 'الانصراف', dataKey: 'checkOut' },
          { header: 'ساعات العمل', dataKey: 'workHours' },
          { header: 'الحالة', dataKey: 'status' },
        ];

        data = filteredAttendance.map(record => {
          const hours = getDisplayWorkHours(record);
          return {
            date: record.date,
            employeeName: record.employeeName,
            checkIn: formatTimeTo12h(record.checkIn),
            checkOut: formatTimeTo12h(record.checkOut),
            workHours: hours != null ? formatWorkHoursFromDecimal(hours) : '-',
            status: record.status,
          };
        });
      } else if (reportType === 'تقرير المخزون') {
        title = 'تقرير المخزون';
        subtitle = `القيمة الإجمالية: ${stats.totalValue?.toFixed(2)} ج.م | أصناف قليلة المخزون: ${stats.lowStock}`;
        
        columns = [
          { header: 'الصنف', dataKey: 'name' },
          { header: 'الكمية', dataKey: 'quantity' },
          { header: 'السعر', dataKey: 'price' },
          { header: 'القيمة', dataKey: 'value' },
          { header: 'الحد الأدنى', dataKey: 'minQuantity' },
        ];

        const qty = (item: { stock?: number; quantity?: number }) => item.stock ?? item.quantity ?? 0;
        const minQ = (item: { minStock?: number; minQuantity?: number }) => item.minStock ?? item.minQuantity ?? 0;
        data = inventory.map(item => ({
          name: item.name,
          quantity: String(qty(item)),
          price: `${Number(item.price).toFixed(2)} ج.م`,
          value: `${(qty(item) * Number(item.price)).toFixed(2)} ج.م`,
          minQuantity: String(minQ(item)),
        }));
      } else if (reportType === 'تقرير العملاء') {
        title = 'تقرير العملاء';
        subtitle = `عدد العملاء: ${customers.length}`;
        
        columns = [
          { header: 'الاسم', dataKey: 'name' },
          { header: 'الهاتف', dataKey: 'phone' },
          { header: 'البريد', dataKey: 'email' },
          { header: 'عدد الزيارات', dataKey: 'visits' },
          { header: 'إجمالي الإنفاق', dataKey: 'totalSpent' },
        ];

        data = customers.map(customer => ({
          name: customer.name,
          phone: customer.phone,
          email: customer.email || '-',
          visits: (customer.visits || 0).toString(),
          totalSpent: `${(customer.totalSpent || 0).toFixed(2)} ج.م`,
        }));
      }

      const dateRange = fromDate && toDate
        ? `من ${new Date(fromDate).toLocaleDateString('ar-EG')} إلى ${new Date(toDate).toLocaleDateString('ar-EG')}`
        : fromDate
        ? `من ${new Date(fromDate).toLocaleDateString('ar-EG')}`
        : toDate
        ? `حتى ${new Date(toDate).toLocaleDateString('ar-EG')}`
        : 'جميع الفترات';

      generateTablePDF({
        title,
        subtitle,
        columns,
        data,
        filename: `${title}-${new Date().toLocaleDateString('ar-EG')}.pdf`,
        shopName: systemSettings.shopName,
        dateRange,
      });

      toast.success('تم تصدير التقرير بنجاح');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast.error('حدث خطأ أثناء تصدير التقرير');
    }
  };

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900" dir="rtl">
      <Header title="التقارير والإحصائيات" />

      <div className="p-4 sm:p-6 lg:p-8">
        {/* Report Type Selection */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">اختر نوع التقرير</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              'تقرير المبيعات',
              'تقرير المصروفات',
              'تقرير الحضور',
              'تقرير المخزون',
              'تقرير العملاء',
            ].map((type) => (
              <Button
                key={type}
                variant={reportType === type ? 'default' : 'outline'}
                onClick={() => setReportType(type)}
                className="h-auto py-3"
              >
                {type}
              </Button>
            ))}
          </div>
        </Card>

        {/* Date Filter */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex gap-4 items-center flex-1">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  من تاريخ
                </label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  إلى تاريخ
                </label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 w-full lg:w-auto mt-4 lg:mt-6">
              <Button
                onClick={() => setShowReport(true)}
                className="gap-2 flex-1 lg:flex-initial"
              >
                <FileText className="w-4 h-4" />
                عرض التقرير
              </Button>
              <Button
                variant="outline"
                onClick={handleExport}
                className="gap-2 flex-1 lg:flex-initial"
              >
                <Download className="w-4 h-4" />
                تصدير PDF
              </Button>
            </div>
          </div>
        </Card>

        {/* Statistics */}
        {showReport && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {reportType === 'تقرير المبيعات' && (
                <>
                  <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                    <div className="flex flex-col items-center text-center">
                      <DollarSign className="w-8 h-8 text-green-500 mb-2" />
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">
                        {stats.totalRevenue?.toFixed(0)}
                      </h3>
                      <p className="text-xs text-gray-600">إجمالي الإيرادات (ج.م)</p>
                    </div>
                  </Card>
                  <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                    <div className="flex flex-col items-center text-center">
                      <ShoppingBag className="w-8 h-8 text-blue-500 mb-2" />
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">
                        {stats.count}
                      </h3>
                      <p className="text-xs text-gray-600">عدد الفواتير</p>
                    </div>
                  </Card>
                  <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                    <div className="flex flex-col items-center text-center">
                      <TrendingUp className="w-8 h-8 text-purple-500 mb-2" />
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">
                        {stats.avgInvoice?.toFixed(0)}
                      </h3>
                      <p className="text-xs text-gray-600">متوسط الفاتورة (ج.م)</p>
                    </div>
                  </Card>
                  <Card className="p-4 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
                    <div className="flex flex-col items-center text-center">
                      <FileText className="w-8 h-8 text-orange-500 mb-2" />
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">
                        {stats.totalDiscount?.toFixed(0)}
                      </h3>
                      <p className="text-xs text-gray-600">إجمالي الخصومات (ج.م)</p>
                    </div>
                  </Card>
                </>
              )}

              {reportType === 'تقرير المصروفات' && (
                <>
                  <Card className="p-4 bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
                    <div className="flex flex-col items-center text-center">
                      <DollarSign className="w-8 h-8 text-red-500 mb-2" />
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">
                        {stats.totalExpenses?.toFixed(0)}
                      </h3>
                      <p className="text-xs text-gray-600">إجمالي المصروفات (ج.م)</p>
                    </div>
                  </Card>
                  <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                    <div className="flex flex-col items-center text-center">
                      <FileText className="w-8 h-8 text-blue-500 mb-2" />
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">
                        {stats.count}
                      </h3>
                      <p className="text-xs text-gray-600">عدد المصروفات</p>
                    </div>
                  </Card>
                </>
              )}

              {reportType === 'تقرير الحضور' && (
                <>
                  <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                    <div className="flex flex-col items-center text-center">
                      <Users className="w-8 h-8 text-green-500 mb-2" />
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">
                        {stats.present}
                      </h3>
                      <p className="text-xs text-gray-600">حاضرون</p>
                    </div>
                  </Card>
                  <Card className="p-4 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
                    <div className="flex flex-col items-center text-center">
                      <Users className="w-8 h-8 text-orange-500 mb-2" />
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">
                        {stats.late}
                      </h3>
                      <p className="text-xs text-gray-600">متأخرون</p>
                    </div>
                  </Card>
                  <Card className="p-4 bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
                    <div className="flex flex-col items-center text-center">
                      <Users className="w-8 h-8 text-red-500 mb-2" />
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">
                        {stats.absent}
                      </h3>
                      <p className="text-xs text-gray-600">غائبون</p>
                    </div>
                  </Card>
                </>
              )}

              {reportType === 'تقرير المخزون' && (
                <>
                  <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                    <div className="flex flex-col items-center text-center">
                      <DollarSign className="w-8 h-8 text-blue-500 mb-2" />
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">
                        {stats.totalValue?.toFixed(0)}
                      </h3>
                      <p className="text-xs text-gray-600">القيمة الإجمالية (ج.م)</p>
                    </div>
                  </Card>
                  <Card className="p-4 bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
                    <div className="flex flex-col items-center text-center">
                      <FileText className="w-8 h-8 text-red-500 mb-2" />
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">
                        {stats.lowStock}
                      </h3>
                      <p className="text-xs text-gray-600">أصناف قليلة المخزون</p>
                    </div>
                  </Card>
                </>
              )}

              {reportType === 'تقرير العملاء' && (
                <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                  <div className="flex flex-col items-center text-center">
                    <Users className="w-8 h-8 text-purple-500 mb-2" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">
                      {customers.length}
                    </h3>
                    <p className="text-xs text-gray-600">إجمالي العملاء</p>
                  </div>
                </Card>
              )}
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {reportType}
              </h3>
              <p className="text-sm text-gray-600">
                اضغط على "تصدير PDF" لتحميل التقرير الكامل
              </p>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}