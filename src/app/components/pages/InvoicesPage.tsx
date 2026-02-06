import { useState, useMemo } from 'react';
import { useApp } from '@/app/context/AppContext';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { 
  Search, 
  FileText, 
  Calendar,
  User,
  CreditCard,
  Printer,
  Eye,
  Filter,
  Download,
  DollarSign,
  CheckCircle,
  Clock,
  X,
  History,
  RefreshCw
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { generateTablePDF, generateInvoicePDF } from '@/utils/pdfExportArabic';
import { toast } from 'sonner';

export default function InvoicesPage() {
  const { sales, customers, shifts, currentUser, systemSettings } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'current' | 'all'>('current');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);

  // Get current user's open shift
  const currentShift = useMemo(() => {
    if (!currentUser) return null;
    return shifts.find(s => s.userId === currentUser.id && s.status === 'open');
  }, [shifts, currentUser]);

  // Filter and search invoices
  const filteredInvoices = useMemo(() => {
    let result = [...sales];

    // View mode filter: Show only current shift invoices or all
    if (viewMode === 'current' && currentShift) {
      // Show only invoices from current shift's date
      result = result.filter(invoice => {
        const invoiceDate = new Date(invoice.date).toDateString();
        const shiftDate = new Date(currentShift.startTime).toDateString();
        return invoiceDate === shiftDate;
      });
    }

    // Date filter (for "all" mode)
    if (dateFilter && viewMode === 'all') {
      result = result.filter(invoice => {
        const invoiceDate = new Date(invoice.date).toISOString().split('T')[0];
        return invoiceDate === dateFilter;
      });
    }

    // Search filter (by customer name or invoice number)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(invoice => 
        invoice.customer?.toLowerCase().includes(query) ||
        invoice.id?.toLowerCase().includes(query) ||
        invoice.customerPhone?.includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(invoice => invoice.status === statusFilter);
    }

    // Payment method filter
    if (paymentMethodFilter !== 'all') {
      result = result.filter(invoice => invoice.paymentMethod === paymentMethodFilter);
    }

    // Sort by date (newest first)
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, searchQuery, statusFilter, paymentMethodFilter, dateFilter, viewMode, currentShift]);

  // Calculate statistics
  const stats = useMemo(() => {
    return {
      total: filteredInvoices.length,
      completed: filteredInvoices.filter(inv => inv.status === 'منتهي' || inv.status === 'completed').length,
      incomplete: filteredInvoices.filter(inv => inv.status !== 'منتهي' && inv.status !== 'completed').length,
      totalRevenue: filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0),
    };
  }, [filteredInvoices]);

  // Export invoices to PDF
  const handleExportToPDF = () => {
    try {
      const columns = [
        { header: 'رقم الفاتورة', dataKey: 'id' },
        { header: 'العميل', dataKey: 'customer' },
        { header: 'التاريخ', dataKey: 'date' },
        { header: 'المبلغ', dataKey: 'amount' },
        { header: 'طريقة الدفع', dataKey: 'paymentMethod' },
        { header: 'الحالة', dataKey: 'status' },
      ];

      const data = filteredInvoices.map(invoice => ({
        id: invoice.id,
        customer: invoice.customer || 'عميل نقدي',
        date: new Date(invoice.date).toLocaleDateString('ar-EG'),
        amount: `${invoice.amount.toFixed(2)} ج.م`,
        paymentMethod: invoice.paymentMethod || 'نقدي',
        status: invoice.status || 'مكتمل',
      }));

      const dateRange = viewMode === 'current' && currentShift
        ? `الوردية الحالية - ${new Date(currentShift.startTime).toLocaleDateString('ar-EG')}`
        : dateFilter
        ? `${new Date(dateFilter).toLocaleDateString('ar-EG')}`
        : 'جميع الفواتير';

      generateTablePDF({
        title: 'تقرير الفواتير',
        subtitle: `عدد الفواتير: ${stats.total} | الإيرادات: ${stats.totalRevenue.toFixed(2)} ج.م`,
        columns,
        data,
        filename: `فواتير-${new Date().toLocaleDateString('ar-EG')}.pdf`,
        shopName: systemSettings.shopName,
        dateRange,
      });

      toast.success('تم تصدير الفواتير بنجاح');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast.error('حدث خطأ أثناء تصدير الفواتير');
    }
  };

  // Print single invoice
  const handlePrintInvoice = (invoice: any) => {
    // Create a print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('يرجى السماح بفتح النوافذ المنبثقة للطباعة');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>فاتورة بيع - ${invoice.id}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
            direction: rtl;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
            background: white;
          }
          
          .header {
            text-align: center;
            border-bottom: 3px solid #9333ea;
            padding-bottom: 25px;
            margin-bottom: 35px;
          }
          
          .header h1 {
            color: #9333ea;
            margin: 0 0 10px 0;
            font-size: 32px;
            font-weight: bold;
          }
          
          .header .shop-name {
            color: #ec4899;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          
          .header .shop-info {
            color: #6b7280;
            font-size: 14px;
            margin-top: 5px;
          }
          
          .invoice-number {
            background: linear-gradient(135deg, #ec4899, #9333ea);
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            display: inline-block;
            margin-top: 10px;
            font-weight: bold;
          }
          
          .info-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 35px;
            gap: 20px;
          }
          
          .info-box {
            flex: 1;
            background: #f9fafb;
            padding: 20px;
            border-radius: 10px;
            border: 1px solid #e5e7eb;
          }
          
          .info-box label {
            font-weight: bold;
            color: #374151;
            display: block;
            margin-bottom: 8px;
            font-size: 14px;
          }
          
          .info-box p {
            margin: 0;
            color: #1f2937;
            font-size: 16px;
            font-weight: 600;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          
          th, td {
            border: 1px solid #e5e7eb;
            padding: 15px;
            text-align: right;
          }
          
          th {
            background: linear-gradient(135deg, #ec4899, #9333ea);
            color: white;
            font-weight: bold;
            font-size: 15px;
          }
          
          tbody tr:nth-child(even) {
            background-color: #faf5ff;
          }
          
          tbody tr:hover {
            background-color: #f3e8ff;
          }
          
          .totals {
            background: linear-gradient(135deg, #faf5ff, #fce7f3);
            padding: 25px;
            border-radius: 12px;
            margin-top: 25px;
            border: 2px solid #e9d5ff;
          }
          
          .totals .row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            font-size: 17px;
            color: #374151;
          }
          
          .totals .row.discount {
            color: #dc2626;
            font-weight: 600;
          }
          
          .totals .row.total {
            font-size: 24px;
            font-weight: bold;
            color: #9333ea;
            border-top: 3px solid #9333ea;
            padding-top: 15px;
            margin-top: 15px;
          }
          
          .notes-section {
            margin-top: 25px;
            padding: 20px;
            background: #fffbeb;
            border-radius: 10px;
            border-right: 4px solid #f59e0b;
          }
          
          .notes-section label {
            font-weight: bold;
            color: #92400e;
            display: block;
            margin-bottom: 8px;
          }
          
          .notes-section p {
            margin: 0;
            color: #78350f;
            line-height: 1.6;
          }
          
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
          }
          
          .footer .thank-you {
            font-size: 18px;
            color: #9333ea;
            font-weight: bold;
            margin-bottom: 10px;
          }
          
          @media print {
            body {
              padding: 20px;
            }
            @page {
              margin: 15mm;
              size: A4;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="shop-name">${systemSettings.shopName}</div>
          ${systemSettings.address ? `<div class="shop-info">العنوان: ${systemSettings.address}</div>` : ''}
          ${systemSettings.phone ? `<div class="shop-info">الهاتف: ${systemSettings.phone}</div>` : ''}
          <h1>فاتورة بيع</h1>
          <div class="invoice-number">رقم الفاتورة: ${invoice.id}</div>
        </div>

        <div class="info-section">
          <div class="info-box">
            <label>العميل:</label>
            <p>${invoice.customer || 'عميل نقدي'}</p>
            ${invoice.customerPhone ? `<p style="color: #6b7280; font-size: 14px; margin-top: 5px;">${invoice.customerPhone}</p>` : ''}
          </div>
          <div class="info-box">
            <label>التاريخ:</label>
            <p>${new Date(invoice.date).toLocaleDateString('ar-EG', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
          </div>
          <div class="info-box">
            <label>طريقة الدفع:</label>
            <p>${invoice.paymentMethod || 'نقدي'}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 50px;">#</th>
              <th>الصنف / الخدمة</th>
              <th style="width: 100px;">الكمية</th>
              <th style="width: 120px;">السعر</th>
              <th style="width: 120px;">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items && invoice.items.length > 0 
              ? invoice.items.map((item: any, index: number) => `
                <tr>
                  <td style="text-align: center; font-weight: bold; color: #6b7280;">${index + 1}</td>
                  <td>
                    <strong>${item.name}</strong>
                    ${item.notes ? `<div style="color: #6b7280; font-size: 13px; margin-top: 4px;">ملاحظات: ${item.notes}</div>` : ''}
                  </td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: center;">${(item.customPrice || item.price).toFixed(2)} ج.م</td>
                  <td style="text-align: center; font-weight: bold;">${(item.quantity * (item.customPrice || item.price)).toFixed(2)} ج.م</td>
                </tr>
              `).join('')
              : `
                <tr>
                  <td style="text-align: center; font-weight: bold; color: #6b7280;">1</td>
                  <td><strong>${invoice.service || 'خدمة'}</strong></td>
                  <td style="text-align: center;">1</td>
                  <td style="text-align: center;">${invoice.amount.toFixed(2)} ج.م</td>
                  <td style="text-align: center; font-weight: bold;">${invoice.amount.toFixed(2)} ج.م</td>
                </tr>
              `
            }
          </tbody>
        </table>

        <div class="totals">
          <div class="row">
            <span>الإجمالي الكلي:</span>
            <span>${(invoice.amount + (invoice.discount || 0)).toFixed(2)} ج.م</span>
          </div>
          ${invoice.discount && invoice.discount > 0 ? `
            <div class="row discount">
              <span>الخصم:</span>
              <span>- ${invoice.discount.toFixed(2)} ج.م</span>
            </div>
          ` : ''}
          <div class="row total">
            <span>الصافي بعد الخصم:</span>
            <span>${invoice.amount.toFixed(2)} ج.م</span>
          </div>
        </div>

        ${invoice.notes ? `
          <div class="notes-section">
            <label>ملاحظات:</label>
            <p>${invoice.notes}</p>
          </div>
        ` : ''}

        <div class="footer">
          <div class="thank-you">شكراً لتعاملكم معنا</div>
          <div>نتمنى لكم تجربة رائعة ونراكم قريباً</div>
          ${systemSettings.email ? `<div style="margin-top: 10px;">${systemSettings.email}</div>` : ''}
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            }
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  // View invoice details
  const handleViewInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowInvoiceDialog(true);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { variant: any; label: string } } = {
      'مكتمل': { variant: 'default', label: 'مكتمل' },
      'completed': { variant: 'default', label: 'مكتمل' },
      'معلق': { variant: 'secondary', label: 'معلق' },
      'pending': { variant: 'secondary', label: '��علق' },
      'ملغي': { variant: 'destructive', label: 'ملغي' },
      'cancelled': { variant: 'destructive', label: 'ملغي' },
    };

    const statusInfo = statusMap[status] || { variant: 'default', label: status };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'نقدي':
      case 'cash':
        return <DollarSign className="w-4 h-4" />;
      case 'بطاقة':
      case 'card':
        return <CreditCard className="w-4 h-4" />;
      case 'instapay':
        return <CreditCard className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 flex items-center gap-3">
              <FileText className="w-8 h-8 text-purple-600" />
              الفواتير
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              إدارة ومتابعة جميع الفواتير
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleExportToPDF}
              disabled={filteredInvoices.length === 0}
            >
              <Download className="w-4 h-4" />
              تصدير PDF
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-2 border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  إجمالي الفواتير
                </p>
                <h3 className="text-3xl font-bold text-purple-700 dark:text-purple-300 mt-2">{stats.total}</h3>
              </div>
              <FileText className="w-12 h-12 text-purple-300 dark:text-purple-700" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-2 border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  مكتملة
                </p>
                <h3 className="text-3xl font-bold text-green-700 dark:text-green-300 mt-2">{stats.completed}</h3>
              </div>
              <CheckCircle className="w-12 h-12 text-green-300 dark:text-green-700" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-2 border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                  غير مكتملة
                </p>
                <h3 className="text-3xl font-bold text-orange-700 dark:text-orange-300 mt-2">{stats.incomplete}</h3>
              </div>
              <Clock className="w-12 h-12 text-orange-300 dark:text-orange-700" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-2 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  إجمالي الإيرادات
                </p>
                <h3 className="text-3xl font-bold text-blue-700 dark:text-blue-300 mt-2">
                  {stats.totalRevenue.toFixed(0)} <span className="text-lg">ج.م</span>
                </h3>
              </div>
              <DollarSign className="w-12 h-12 text-blue-300 dark:text-blue-700" />
            </div>
          </Card>
        </div>

        {/* View Mode Toggle */}
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              عرض:
            </p>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'current' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('current')}
                className="gap-2"
              >
                <Clock className="w-4 h-4" />
                الوردية الحالية
              </Button>
              <Button
                variant={viewMode === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('all')}
                className="gap-2"
              >
                <History className="w-4 h-4" />
                جميع الفواتير
              </Button>
            </div>
          </div>
        </Card>

        {/* Filters */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="بحث عن فاتورة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="completed">مكتمل</SelectItem>
                <SelectItem value="incomplete">غير مكتمل</SelectItem>
              </SelectContent>
            </Select>

            {/* Payment Method Filter */}
            <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
              <SelectTrigger>
                <SelectValue placeholder="طريقة الدفع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="نقدي">نقدي</SelectItem>
                <SelectItem value="بطاقة">بطاقة</SelectItem>
                <SelectItem value="InstaPay">InstaPay</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Filter (only for "all" mode) */}
            {viewMode === 'all' && (
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}

            {/* Clear Filters */}
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setPaymentMethodFilter('all');
                setDateFilter('');
              }}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              إعادة تعيين
            </Button>
          </div>
        </Card>

        {/* Invoices Table */}
        <Card className="p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رقم الفاتورة</TableHead>
                  <TableHead className="text-right">العميل</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">المبلغ</TableHead>
                  <TableHead className="text-right">طريقة الدفع</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="w-12 h-12 text-gray-300" />
                        <p className="text-gray-500">لا توجد فواتير</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono font-bold text-purple-600">
                        {invoice.id}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="font-medium">{invoice.customer || 'عميل نقدي'}</p>
                            {invoice.customerPhone && (
                              <p className="text-xs text-gray-500">{invoice.customerPhone}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(invoice.date).toLocaleDateString('ar-EG')}
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-green-600">
                        {invoice.amount.toFixed(2)} ج.م
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPaymentMethodIcon(invoice.paymentMethod)}
                          <span>{invoice.paymentMethod || 'نقدي'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(invoice.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewInvoice(invoice)}
                            title="عرض التفاصيل"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePrintInvoice(invoice)}
                            title="طباعة الفاتورة"
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}