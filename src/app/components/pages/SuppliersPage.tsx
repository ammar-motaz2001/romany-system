import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, FileText, Search, Printer, CheckCircle, XCircle, AlertCircle, X, RefreshCcw, Database, WifiOff } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import Header from '@/app/components/Header';
import { toast } from 'sonner';
import supplierService, { Supplier, CreateSupplierDTO } from '@/services/supplier.service';
import purchaseInvoiceService, { PurchaseInvoice, CreatePurchaseInvoiceDTO } from '@/services/purchaseInvoice.service';
import { useApp } from '@/app/context/AppContext';

export default function SuppliersPage() {
  const { inventory, addInventoryItem, updateInventoryItem } = useApp();
  const [activeTab, setActiveTab] = useState<'suppliers' | 'invoices'>('suppliers');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSupplierDialog, setShowSupplierDialog] = useState(false);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showInvoiceDetailsDialog, setShowInvoiceDetailsDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<PurchaseInvoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Data states
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>([]);

  // Form states
  const [supplierForm, setSupplierForm] = useState<CreateSupplierDTO>({
    name: '',
    phone: '',
    address: '',
    status: 'نشط',
    notes: '',
  });

  const [invoiceForm, setInvoiceForm] = useState({
    supplier: '',
    date: new Date().toISOString().split('T')[0],
    items: [{ itemName: '', quantity: 1, unitPrice: 0 }],
    wholesaleAmount: 0,
    saleAmount: 0,
    paymentMethod: 'نقدي' as 'نقدي' | 'آجل' | 'مختلط',
    notes: '',
  });

  // Fetch data
  useEffect(() => {
    fetchSuppliers();
    fetchInvoices();
  }, []);

  // Populate form when editing invoice
  useEffect(() => {
    if (editingInvoice && showInvoiceDialog) {
      setInvoiceForm({
        supplier: editingInvoice.supplier,
        date: editingInvoice.date.split('T')[0],
        items: editingInvoice.items.map(item => ({
          itemName: item.itemName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        wholesaleAmount: editingInvoice.wholesaleAmount || 0,
        saleAmount: editingInvoice.saleAmount ?? (editingInvoice as any).paidAmount ?? 0,
        paymentMethod: editingInvoice.paymentMethod,
        notes: editingInvoice.notes || '',
      });
    }
  }, [editingInvoice, showInvoiceDialog]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setConnectionError(false);
      const data = await supplierService.getAllSuppliers();
      setSuppliers(data);
      setIsOfflineMode(false);
    } catch (error: any) {
      console.error('Error fetching suppliers:', error);
      if (!error.response) {
        // Backend not available - localStorage will be used automatically
        setConnectionError(true);
        setIsOfflineMode(true);
      } else {
        toast.error(error.response?.data?.error || 'حدث خطأ في جلب التجار');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setConnectionError(false);
      const data = await purchaseInvoiceService.getAllInvoices();
      setPurchaseInvoices(data);
      setIsOfflineMode(false);
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      if (!error.response) {
        // Backend not available - localStorage will be used automatically
        setConnectionError(true);
        setIsOfflineMode(true);
      } else {
        toast.error(error.response?.data?.error || 'حدث خطأ في جلب الفواتير');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetryConnection = () => {
    fetchSuppliers();
    fetchInvoices();
  };

  // Filter suppliers
  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.phone.includes(searchQuery)
  );

  // Filter invoices
  const filteredInvoices = purchaseInvoices.filter(invoice =>
    invoice.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Statistics
  const activeSuppliers = suppliers.filter(s => s.status === 'نشط').length;
  const totalBalance = suppliers.reduce((sum, s) => sum + s.balance, 0);
  const paidInvoices = purchaseInvoices.filter(i => i.status === 'مدفوعة').length;
  const unpaidInvoices = purchaseInvoices.filter(i => i.status === 'غير مدفوعة').length;

  // Handler functions for suppliers
  const handleOpenSupplierDialog = () => {
    setSupplierForm({
      name: '',
      phone: '',
      address: '',
      status: 'نشط',
      notes: '',
    });
    setEditingSupplier(null);
    setShowSupplierDialog(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setSupplierForm({
      name: supplier.name,
      phone: supplier.phone,
      address: supplier.address || '',
      status: supplier.status,
      notes: supplier.notes || '',
    });
    setEditingSupplier(supplier);
    setShowSupplierDialog(true);
  };

  const handleDeleteSupplier = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا التاجر؟')) {
      try {
        await supplierService.deleteSupplier(id);
        toast.success('تم حذف التاجر بنجاح');
        fetchSuppliers();
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'حدث خطأ في حذف التاجر');
      }
    }
  };

  const handleSubmitSupplier = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierForm.name || !supplierForm.phone) {
      toast.error('يرجى إدخال الاسم ورقم الهاتف');
      return;
    }

    try {
      setLoading(true);
      if (editingSupplier) {
        await supplierService.updateSupplier(editingSupplier._id, supplierForm);
        toast.success('تم تحديث بيانات التاجر بنجاح');
      } else {
        await supplierService.createSupplier(supplierForm);
        toast.success('تم إضافة التاجر بنجاح');
      }
      setShowSupplierDialog(false);
      setEditingSupplier(null);
      fetchSuppliers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'حدث خطأ في حفظ التاجر');
    } finally {
      setLoading(false);
    }
  };

  // Handler functions for invoices
  const handleOpenInvoiceDialog = () => {
    setInvoiceForm({
      supplier: '',
      date: new Date().toISOString().split('T')[0],
      items: [{ itemName: '', quantity: 1, unitPrice: 0 }],
      wholesaleAmount: 0,
      saleAmount: 0,
      paymentMethod: 'نقدي',
      notes: '',
    });
    setEditingInvoice(null);
    setShowInvoiceDialog(true);
  };

  const handleViewInvoice = (invoice: PurchaseInvoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceDetailsDialog(true);
  };

  const handlePrintInvoice = (invoice: PurchaseInvoice) => {
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
        <title>فاتورة شراء - ${invoice.invoiceNumber}</title>
        <style>
          body {
            font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
            direction: rtl;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #9333ea;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #9333ea;
            margin: 0;
          }
          .info-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          .info-box {
            flex: 1;
          }
          .info-box label {
            font-weight: bold;
            color: #4b5563;
            display: block;
            margin-bottom: 5px;
          }
          .info-box p {
            margin: 0;
            color: #1f2937;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #e5e7eb;
            padding: 12px;
            text-align: right;
          }
          th {
            background-color: #f3f4f6;
            font-weight: bold;
            color: #374151;
          }
          .totals {
            background-color: #faf5ff;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
          }
          .totals .row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 16px;
          }
          .totals .row.total {
            font-size: 20px;
            font-weight: bold;
            color: #9333ea;
            border-top: 2px solid #9333ea;
            padding-top: 10px;
            margin-top: 10px;
          }
          @media print {
            body {
              padding: 0;
            }
            @page {
              margin: 20mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>فاتورة شراء</h1>
          <p>رقم الفاتورة: ${invoice.invoiceNumber}</p>
        </div>

        <div class="info-section">
          <div class="info-box">
            <label>التاجر:</label>
            <p>${invoice.supplierName}</p>
          </div>
          <div class="info-box">
            <label>التاريخ:</label>
            <p>${new Date(invoice.date).toLocaleDateString('ar-EG')}</p>
          </div>
          <div class="info-box">
            <label>طريقة الدفع:</label>
            <p>${invoice.paymentMethod}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>الصنف</th>
              <th>الكمية</th>
              <th>السعر</th>
              <th>الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => `
              <tr>
                <td>${item.itemName}</td>
                <td>${item.quantity}</td>
                <td>${item.unitPrice.toFixed(2)} ج.م</td>
                <td>${item.totalPrice.toFixed(2)} ج.م</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="row">
            <span>الإجمالي الكلي:</span>
            <span>${invoice.totalAmount.toFixed(2)} ج.م</span>
          </div>
          <div class="row">
            <span>مبلغ البيع:</span>
            <span>${(invoice.saleAmount ?? invoice.paidAmount ?? 0).toFixed(2)} ج.م</span>
          </div>
          <div class="row total">
            <span>المتبقي:</span>
            <span>${invoice.remainingAmount.toFixed(2)} ج.م</span>
          </div>
        </div>

        ${invoice.notes ? `
          <div style="margin-top: 20px; padding: 15px; background-color: #f9fafb; border-radius: 8px;">
            <label style="font-weight: bold; color: #4b5563;">ملاحظات:</label>
            <p style="margin: 5px 0 0 0; color: #1f2937;">${invoice.notes}</p>
          </div>
        ` : ''}

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

  const handleDeleteInvoice = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
      try {
        await purchaseInvoiceService.deleteInvoice(id);
        toast.success('تم حذف الفاتورة بنجاح');
        fetchInvoices();
        fetchSuppliers(); // Refresh to update balances
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'حدث خطأ في حذف الفاتورة');
      }
    }
  };

  const handleAddInvoiceItem = () => {
    setInvoiceForm({
      ...invoiceForm,
      items: [...invoiceForm.items, { itemName: '', quantity: 1, unitPrice: 0 }],
    });
  };

  const handleRemoveInvoiceItem = (index: number) => {
    if (invoiceForm.items.length > 1) {
      setInvoiceForm({
        ...invoiceForm,
        items: invoiceForm.items.filter((_, i) => i !== index),
      });
    }
  };

  const handleUpdateInvoiceItem = (index: number, field: string, value: any) => {
    const newItems = [...invoiceForm.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setInvoiceForm({ ...invoiceForm, items: newItems });
  };

  const calculateInvoiceTotal = () => {
    return invoiceForm.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const handleSubmitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invoiceForm.supplier) {
      toast.error('يرجى اختيار التاجر');
      return;
    }

    if (invoiceForm.items.length === 0 || !invoiceForm.items.every(item => item.itemName && item.quantity > 0)) {
      toast.error('يرجى إضافة أصناف صحيحة للفاتورة');
      return;
    }

    try {
      setLoading(true);
      const invoiceData: CreatePurchaseInvoiceDTO = {
        supplier: invoiceForm.supplier,
        date: invoiceForm.date,
        items: invoiceForm.items,
        wholesaleAmount: invoiceForm.wholesaleAmount,
        saleAmount: invoiceForm.saleAmount,
        paymentMethod: invoiceForm.paymentMethod,
        notes: invoiceForm.notes,
      };

      if (editingInvoice) {
        await purchaseInvoiceService.updateInvoice(editingInvoice._id, invoiceData);
        toast.success('تم تحديث الفاتورة بنجاح');
      } else {
        await purchaseInvoiceService.createInvoice(invoiceData);
        toast.success('تم إضافة الفاتورة بنجاح');

        // Add/update items in inventory (إدارة المخزون)
        for (const item of invoiceForm.items) {
          const name = (item.itemName ?? '').trim();
          if (!name || item.quantity <= 0) continue;
          const existing = inventory.find(
            (inv) => inv.name.toLowerCase() === name.toLowerCase()
          );
          if (existing) {
            await updateInventoryItem(existing.id, {
              name: existing.name,
              category: existing.category,
              stock: existing.stock + item.quantity,
              price: item.unitPrice,
              minStock: existing.minStock,
              image: existing.image,
            });
          } else {
            await addInventoryItem({
              name,
              category: 'مشتريات',
              stock: item.quantity,
              price: item.unitPrice,
              minStock: 10,
            });
          }
        }
      }

      setShowInvoiceDialog(false);
      setEditingInvoice(null);
      fetchInvoices();
      fetchSuppliers(); // Refresh to update balances
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'حدث خطأ في حفظ الفاتورة');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      'مدفوعة': 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      'جزئية': 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
      'غير مدفوعة': 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
  };

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900" dir="rtl">
      <Header title="التجار وفواتير الشراء" />
      
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Connection Status Banner */}
          {isOfflineMode && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-100 dark:bg-amber-900 p-2 rounded-lg">
                    <WifiOff className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-900 dark:text-amber-100">وضع عدم الاتصال</h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      تعذر الاتصال بالخادم. البيانات محفوظة محلياً
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleRetryConnection}
                  variant="outline"
                  size="sm"
                  className="border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900"
                >
                  <RefreshCcw className="h-4 w-4 ml-2" />
                  إعادة المحاولة
                </Button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-pulse" />
                <p className="text-sm text-blue-700 dark:text-blue-300">جارِ تحميل البيانات...</p>
              </div>
            </div>
          )}

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
            <Card className="p-6 dark:bg-gray-800">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">التجار النشطين</p>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{activeSuppliers}</h3>
                </div>
                <div className="bg-green-100 dark:bg-green-900 p-3 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </Card>

            <Card className="p-6 dark:bg-gray-800">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">إجمالي الرصيد</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{totalBalance.toFixed(2)} ج.م</h3>
                </div>
                <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-xl">
                  <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </Card>

            <Card className="p-6 dark:bg-gray-800">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">فواتير مدفوعة</p>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{paidInvoices}</h3>
                </div>
                <div className="bg-emerald-100 dark:bg-emerald-900 p-3 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </Card>

            <Card className="p-6 dark:bg-gray-800">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">فواتير غير مدفوعة</p>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{unpaidInvoices}</h3>
                </div>
                <div className="bg-red-100 dark:bg-red-900 p-3 rounded-xl">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <Button
              onClick={() => setActiveTab('suppliers')}
              variant={activeTab === 'suppliers' ? 'default' : 'outline'}
              className={activeTab === 'suppliers' 
                ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }
            >
              التجار
            </Button>
            <Button
              onClick={() => setActiveTab('invoices')}
              variant={activeTab === 'invoices' ? 'default' : 'outline'}
              className={activeTab === 'invoices' 
                ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }
            >
              فواتير الشراء
            </Button>
          </div>

          {/* Search and Add */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder={activeTab === 'suppliers' ? 'ابحث عن تاجر...' : 'ابحث عن فاتورة...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 bg-white dark:bg-gray-800"
              />
            </div>
            <Button
              onClick={activeTab === 'suppliers' ? handleOpenSupplierDialog : handleOpenInvoiceDialog}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="h-5 w-5 ml-2" />
              {activeTab === 'suppliers' ? 'إضافة تاجر جديد' : 'إضافة فاتورة شراء'}
            </Button>
          </div>

          {/* Content */}
          {activeTab === 'suppliers' ? (
            <Card className="overflow-hidden dark:bg-gray-800">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 md:px-6 py-3 text-right text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-200">الاسم</th>
                      <th className="px-4 md:px-6 py-3 text-right text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-200">الهاتف</th>
                      <th className="px-4 md:px-6 py-3 text-right text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-200 hidden md:table-cell">العنوان</th>
                      <th className="px-4 md:px-6 py-3 text-right text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-200">الرصيد</th>
                      <th className="px-4 md:px-6 py-3 text-right text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-200 hidden sm:table-cell">الحالة</th>
                      <th className="px-4 md:px-6 py-3 text-right text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-200">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredSuppliers.map((supplier) => (
                      <tr key={supplier._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-4 md:px-6 py-4 text-sm text-gray-900 dark:text-gray-100 font-medium">{supplier.name}</td>
                        <td className="px-4 md:px-6 py-4 text-sm text-gray-600 dark:text-gray-300 font-mono">{supplier.phone}</td>
                        <td className="px-4 md:px-6 py-4 text-sm text-gray-600 dark:text-gray-400 hidden md:table-cell">{supplier.address || '-'}</td>
                        <td className="px-4 md:px-6 py-4 text-sm">
                          <span className={`font-semibold ${supplier.balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            {supplier.balance.toFixed(2)} ج.م
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-4 text-sm hidden sm:table-cell">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            supplier.status === 'نشط' 
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                              : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                          }`}>
                            {supplier.status}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-4 text-sm">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditSupplier(supplier)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteSupplier(supplier._id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredSuppliers.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">لا توجد تجار</p>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="overflow-hidden dark:bg-gray-800">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 md:px-6 py-3 text-right text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-200">رقم الفاتورة</th>
                      <th className="px-4 md:px-6 py-3 text-right text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-200">التاجر</th>
                      <th className="px-4 md:px-6 py-3 text-right text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-200 hidden lg:table-cell">التاريخ</th>
                      <th className="px-4 md:px-6 py-3 text-right text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-200">الإجمالي</th>
                      <th className="px-4 md:px-6 py-3 text-right text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-200 hidden md:table-cell">مبلغ البيع</th>
                      <th className="px-4 md:px-6 py-3 text-right text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-200 hidden md:table-cell">المتبقي</th>
                      <th className="px-4 md:px-6 py-3 text-right text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-200 hidden sm:table-cell">الحالة</th>
                      <th className="px-4 md:px-6 py-3 text-right text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-200">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredInvoices.map((invoice) => (
                      <tr key={invoice._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-4 md:px-6 py-4 text-sm font-mono text-gray-900 dark:text-gray-100">{invoice.invoiceNumber}</td>
                        <td className="px-4 md:px-6 py-4 text-sm text-gray-900 dark:text-gray-100 font-medium">{invoice.supplierName}</td>
                        <td className="px-4 md:px-6 py-4 text-sm text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                          {new Date(invoice.date).toLocaleDateString('ar-EG')}
                        </td>
                        <td className="px-4 md:px-6 py-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {invoice.totalAmount.toFixed(2)} ج.م
                        </td>
                        <td className="px-4 md:px-6 py-4 text-sm text-green-600 dark:text-green-400 font-semibold hidden md:table-cell">
                          {(invoice.saleAmount ?? (invoice as any).paidAmount ?? 0).toFixed(2)} ج.م
                        </td>
                        <td className="px-4 md:px-6 py-4 text-sm text-red-600 dark:text-red-400 font-semibold hidden md:table-cell">
                          {invoice.remainingAmount.toFixed(2)} ج.م
                        </td>
                        <td className="px-4 md:px-6 py-4 text-sm hidden sm:table-cell">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(invoice.status)}`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-4 text-sm">
                          <div className="flex gap-1 md:gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewInvoice(invoice)}
                              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handlePrintInvoice(invoice)}
                              className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteInvoice(invoice._id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredInvoices.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">لا توجد فواتير</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Supplier Dialog */}
      {showSupplierDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-gray-800 shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                  {editingSupplier ? 'تعديل التاجر' : 'إضافة تاجر جديد'}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSupplierDialog(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <form onSubmit={handleSubmitSupplier} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    الاسم <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={supplierForm.name}
                    onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                    placeholder="أدخل اسم التاجر"
                    className="dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    رقم الهاتف <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    placeholder="أدخل رقم الهاتف"
                    className="dark:bg-gray-700 dark:text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">العنوان</label>
                  <Input
                    value={supplierForm.address}
                    onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                    placeholder="أدخل العنوان"
                    className="dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">الحالة</label>
                  <select
                    value={supplierForm.status}
                    onChange={(e) => setSupplierForm({ ...supplierForm, status: e.target.value as 'نشط' | 'موقوف' })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="نشط">نشط</option>
                    <option value="موقوف">موقوف</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ملاحظات</label>
                  <textarea
                    value={supplierForm.notes}
                    onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })}
                    placeholder="أدخل أي ملاحظات"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px] resize-y"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {loading ? 'جارِ الحفظ...' : (editingSupplier ? 'تحديث' : 'إضافة')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowSupplierDialog(false)}
                    className="flex-1"
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* Invoice Dialog */}
      {showInvoiceDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto dark:bg-gray-800 shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                  {editingInvoice ? 'تعديل فاتورة الشراء' : 'إضافة فاتورة شراء جديدة'}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInvoiceDialog(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <form onSubmit={handleSubmitInvoice} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      التاجر <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={invoiceForm.supplier}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, supplier: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    >
                      <option value="">اختر التاجر</option>
                      {suppliers.filter(s => s.status === 'نشط').map((supplier) => (
                        <option key={supplier._id} value={supplier._id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">التاريخ</label>
                    <Input
                      type="date"
                      value={invoiceForm.date}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, date: e.target.value })}
                      className="dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">طريقة الدفع</label>
                    <select
                      value={invoiceForm.paymentMethod}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, paymentMethod: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="نقدي">نقدي</option>
                      <option value="آجل">آجل</option>
                      <option value="مختلط">مختلط</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      الأصناف <span className="text-red-500">*</span>
                    </label>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddInvoiceItem}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Plus className="h-4 w-4 ml-1" />
                      إضافة صنف
                    </Button>
                  </div>

                  <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                    {invoiceForm.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-end bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="col-span-12 md:col-span-5">
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">اسم الصنف</label>
                          <Input
                            value={item.itemName}
                            onChange={(e) => handleUpdateInvoiceItem(index, 'itemName', e.target.value)}
                            placeholder="اسم الصنف"
                            className="dark:bg-gray-700 dark:text-white"
                            required
                          />
                        </div>
                        <div className="col-span-4 md:col-span-2">
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">الكمية</label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateInvoiceItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            placeholder="الكمية"
                            className="dark:bg-gray-700 dark:text-white"
                            required
                          />
                        </div>
                        <div className="col-span-4 md:col-span-3">
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">السعر</label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => handleUpdateInvoiceItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            placeholder="السعر"
                            className="dark:bg-gray-700 dark:text-white"
                            required
                          />
                        </div>
                        <div className="col-span-3 md:col-span-1 text-center">
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">المجموع</label>
                          <p className="text-sm font-bold text-purple-600 dark:text-purple-400 py-2">
                            {(item.quantity * item.unitPrice).toFixed(2)}
                          </p>
                        </div>
                        <div className="col-span-1 flex items-end justify-center">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveInvoiceItem(index)}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                            disabled={invoiceForm.items.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-purple-900 dark:text-purple-100">الإجمالي الكلي:</span>
                      <span className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        {calculateInvoiceTotal().toFixed(2)} ج.م
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">مبلغ الجمله</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={invoiceForm.wholesaleAmount}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, wholesaleAmount: parseFloat(e.target.value) || 0 })}
                      placeholder="أدخل مبلغ الجمله"
                      className="dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">مبلغ البيع</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max={calculateInvoiceTotal()}
                      value={invoiceForm.saleAmount}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, saleAmount: parseFloat(e.target.value) || 0 })}
                      placeholder="أدخل مبلغ البيع"
                      className="dark:bg-gray-700 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      المتبقي: {(calculateInvoiceTotal() - invoiceForm.saleAmount).toFixed(2)} ج.م
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ملاحظات</label>
                  <textarea
                    value={invoiceForm.notes}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                    placeholder="أدخل أي ملاحظات"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[80px] resize-y"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {loading ? 'جارِ الحفظ...' : (editingInvoice ? 'تحديث الفاتورة' : 'إضافة الفاتورة')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowInvoiceDialog(false)}
                    className="flex-1"
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* Invoice Details Dialog */}
      {showInvoiceDetailsDialog && selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto dark:bg-gray-800 shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">تفاصيل الفاتورة</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInvoiceDetailsDialog(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 p-5 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">رقم الفاتورة</p>
                    <p className="text-lg font-semibold text-purple-900 dark:text-purple-100 font-mono">{selectedInvoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">التاريخ</p>
                    <p className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                      {new Date(selectedInvoice.date).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">التاجر</p>
                    <p className="text-lg font-semibold text-purple-900 dark:text-purple-100">{selectedInvoice.supplierName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">طريقة الدفع</p>
                    <p className="text-lg font-semibold text-purple-900 dark:text-purple-100">{selectedInvoice.paymentMethod}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    الأصناف
                  </h3>
                  <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">الصنف</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">الكمية</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">السعر</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">الإجمالي</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {selectedInvoice.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{item.itemName}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{item.quantity}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-mono">{item.unitPrice.toFixed(2)} ج.م</td>
                            <td className="px-4 py-3 text-sm font-semibold text-purple-600 dark:text-purple-400 font-mono">
                              {item.totalPrice.toFixed(2)} ج.م
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-3 p-5 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                  <div className="flex justify-between text-base">
                    <span className="text-gray-700 dark:text-gray-300">الإجمالي الكلي:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100 font-mono">{selectedInvoice.totalAmount.toFixed(2)} ج.م</span>
                  </div>
                  {selectedInvoice.wholesaleAmount !== undefined && selectedInvoice.wholesaleAmount > 0 && (
                    <div className="flex justify-between text-base">
                      <span className="text-gray-700 dark:text-gray-300">مبلغ الجمله:</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400 font-mono">{selectedInvoice.wholesaleAmount.toFixed(2)} ج.م</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base">
                    <span className="text-gray-700 dark:text-gray-300">مبلغ البيع:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400 font-mono">{(selectedInvoice.saleAmount ?? (selectedInvoice as any).paidAmount ?? 0).toFixed(2)} ج.م</span>
                  </div>
                  <div className="flex justify-between text-lg pt-3 border-t-2 border-purple-300 dark:border-purple-700">
                    <span className="font-semibold text-purple-900 dark:text-purple-100">المتبقي:</span>
                    <span className="font-bold text-red-600 dark:text-red-400 font-mono">{selectedInvoice.remainingAmount.toFixed(2)} ج.م</span>
                  </div>
                </div>

                {selectedInvoice.notes && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">ملاحظات:</p>
                    <p className="text-gray-900 dark:text-gray-100">{selectedInvoice.notes}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => handlePrintInvoice(selectedInvoice)}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Printer className="h-5 w-5 ml-2" />
                    طباعة الفاتورة
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowInvoiceDetailsDialog(false)}
                    className="flex-1"
                  >
                    إغلاق
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
