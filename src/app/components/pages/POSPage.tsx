import React, { useState, useRef } from 'react';
import { Plus, Minus, Trash2, CreditCard, Banknote, Calendar, Printer, Check, User, Phone, Percent, Smartphone, Clock, ShoppingCart, X } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import Header from '@/app/components/Header';
import ShiftClosingModal from './ShiftClosingModal';
import { useApp } from '@/app/context/AppContext';
import { NotificationManager } from '@/app/utils/notifications';
import { toast } from 'sonner';

// POS Page with Shift Closing Feature

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  isInventoryItem?: boolean;
  customPrice?: number;
  notes?: string;
}

export default function POSPage() {
  const { 
    services, 
    inventory, 
    addSale, 
    getOrCreateCustomer, 
    addAppointment,
    updateAppointment,
    appointments,
    systemSettings,
    decreaseInventoryStock,
    sales,
    shifts,
    addShift,
    updateShift,
    currentUser
  } = useApp();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeTab, setActiveTab] = useState('الكل');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'instapay' | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<any>(null);
  const [showShiftClosing, setShowShiftClosing] = useState(false);
  const [showStartShiftDialog, setShowStartShiftDialog] = useState(false);
  const [startingCash, setStartingCash] = useState('');
  const [showCartModal, setShowCartModal] = useState(false);
  
  // Customer info - Enhanced
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerName, setCustomerName] = useState('عميل نقدي');
  const [customerPhone, setCustomerPhone] = useState('0000000000');
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [showQuickAddCustomer, setShowQuickAddCustomer] = useState(false);
  const [quickCustomerName, setQuickCustomerName] = useState('');
  const [quickCustomerPhone, setQuickCustomerPhone] = useState('');
  const [quickCustomerEmail, setQuickCustomerEmail] = useState('');
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);

  // Discount
  const [discount, setDiscount] = useState('0');
  
  // Next appointment
  const [nextAppointmentDate, setNextAppointmentDate] = useState('');
  const [nextAppointmentTime, setNextAppointmentTime] = useState('');
  const [nextAppointmentSpecialist, setNextAppointmentSpecialist] = useState('');
  
  // Custom Item
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');
  const [customItemNotes, setCustomItemNotes] = useState('');

  const printRef = useRef<HTMLDivElement>(null);

  // Customer handlers
  const { customers, addCustomer } = useApp();

  const handleSelectCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone);
    setShowCustomerSearch(false);
    setCustomerSearchQuery('');
  };

  const handleResetToGuestCustomer = () => {
    setSelectedCustomer(null);
    setCustomerName('عميل نقدي');
    setCustomerPhone('0000000000');
  };

  const handleQuickAddCustomer = async () => {
    if (!quickCustomerName?.trim() || !quickCustomerPhone?.trim()) {
      toast.error('يرجى إدخال الاسم ورقم الهاتف على الأقل');
      return;
    }

    setIsAddingCustomer(true);
    try {
      const newCustomer = await addCustomer({
        name: quickCustomerName.trim(),
        email: quickCustomerEmail?.trim() || `${quickCustomerPhone}@temp.com`,
        phone: quickCustomerPhone.trim(),
        vip: false,
      });

      handleSelectCustomer(newCustomer);
      setShowQuickAddCustomer(false);
      setQuickCustomerName('');
      setQuickCustomerPhone('');
      setQuickCustomerEmail('');
      toast.success('تم إضافة العميل بنجاح! ✅');
    } catch {
      // Error already shown by addCustomer
    } finally {
      setIsAddingCustomer(false);
    }
  };

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
    customer.phone.includes(customerSearchQuery) ||
    customer.email.toLowerCase().includes(customerSearchQuery.toLowerCase())
  );

  // Get current open shift
  const currentShift = shifts.find(shift => shift.status === 'open');
  
  // Get sales for this shift (عدد المعاملات = الفواتير in this shift)
  const todaySales = currentShift
    ? sales.filter(sale => {
        const shiftId = (sale as { shiftId?: string }).shiftId;
        if (shiftId != null && shiftId !== '') return shiftId === currentShift.id;
        const shiftDay = new Date(currentShift.startTime).toISOString().split('T')[0];
        return sale.date === shiftDay;
      })
    : [];

  const handleStartShift = async () => {
    if (!startingCash) {
      alert('يرجى إدخال رصيد الكاش الافتتاحي!');
      return;
    }

    const cashierName = currentUser?.name?.trim() || currentUser?.username?.trim() || 'كاشير';

    try {
      await addShift({
        startTime: new Date().toISOString(),
        endTime: '',
        startingCash: parseFloat(startingCash),
        totalSales: 0,
        totalExpenses: 0,
        finalCash: 0,
        status: 'open',
        date: new Date().toISOString(),
        cashier: cashierName,
        salesDetails: {
          cash: 0,
          card: 0,
          instapay: 0,
        },
      });

      // Request notification permission and send notification
      NotificationManager.requestPermission().then((enabled) => {
        if (enabled) {
          NotificationManager.notifyShiftStarted(cashierName, parseFloat(startingCash));
        }
      });

      setShowStartShiftDialog(false);
      setStartingCash('');
    } catch {
      // Error already shown by addShift toast
    }
  };

  const categories = ['الكل', 'تصفيف الشعر', 'العناية بالبشرة', 'مكياج', 'منتجات التجميل'];

  // Combine services and inventory items
  const allProducts = [
    ...services.map(service => ({
      ...service,
      id: `service-${service.id}`,
      duration: service.duration || '30 دقيقة',
      type: 'service' as const,
    })),
    ...inventory.map(item => ({
      ...item,
      id: `inventory-${item.id}`,
      duration: 'منتج',
      type: 'inventory' as const,
    }))
  ];

  // Filter products by category
  const filteredProducts = activeTab === 'الكل' 
    ? allProducts 
    : allProducts.filter(product => product.category === activeTab);

  const addToCart = (product: any) => {
    // Check if shift is open
    if (!currentShift) {
      alert('يجب فتح وردية أولاً قبل البدء في المبيعات');
      setShowStartShiftDialog(true);
      return;
    }

    // Check inventory stock if it's an inventory item
    if (product.type === 'inventory') {
      const inventoryItem = inventory.find(i => i.id === product.id.replace('inventory-', ''));
      if (inventoryItem && inventoryItem.stock <= 0) {
        alert('عذراً، هذا المنتج غير متوفر في المخزون');
        return;
      }
    }

    const existingItem = cart.find((item) => item.id === product.id);
    if (existingItem) {
      setCart(cart.map((item) =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { 
        id: product.id, 
        name: product.name, 
        price: product.price, 
        quantity: 1,
        isInventoryItem: product.type === 'inventory'
      }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map((item) =>
      item.id === id
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    ));
  };

  const updateCustomPrice = (id: string, customPrice: number | undefined) => {
    setCart(cart.map((item) =>
      item.id === id ? { ...item, customPrice } : item
    ));
  };

  const updateNotes = (id: string, notes: string) => {
    setCart(cart.map((item) =>
      item.id === id ? { ...item, notes } : item
    ));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const addCustomItem = () => {
    // Check if shift is open
    if (!currentShift) {
      alert('يجب فتح وردية أولاً قبل البدء في المبيعات');
      setShowStartShiftDialog(true);
      return;
    }

    if (!customItemName || !customItemPrice) {
      alert('يرجى إدخال اسم العنصر والسعر');
      return;
    }

    const customItem: CartItem = {
      id: `custom-${Date.now()}`,
      name: customItemName,
      price: parseFloat(customItemPrice),
      quantity: 1,
      notes: customItemNotes,
      customPrice: parseFloat(customItemPrice)
    };

    setCart([...cart, customItem]);

    // Reset custom item fields
    setCustomItemName('');
    setCustomItemPrice('');
    setCustomItemNotes('');
  };

  const subtotal = cart.reduce((sum, item) => {
    const itemPrice = item.customPrice !== undefined ? item.customPrice : item.price;
    return sum + itemPrice * item.quantity;
  }, 0);
  const discountAmount = subtotal * (parseFloat(discount) || 0) / 100;
  const total = subtotal - discountAmount;

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('السلة فارغة! أضف منتجات أولاً');
      return;
    }
    
    // Check if customer is required (when there's next appointment)
    const isCustomerRequired = !!(nextAppointmentDate && nextAppointmentTime);
    
    if (isCustomerRequired && (customerName === 'عميل نقدي' || customerPhone === '0000000000')) {
      toast.warning('يجب اختيار عميل مسجل عند حجز موعد قادم!');
      setShowCustomerSearch(true);
      return;
    }
    
    setShowPaymentDialog(true);
  };

  const confirmPayment = () => {
    if (!paymentMethod) {
      toast.error('يرجى اختيار طريقة الدفع');
      return;
    }

    setShowPaymentDialog(false);
    const methodName = paymentMethod === 'cash' ? 'نقدي' : paymentMethod === 'card' ? 'بطاقة' : 'InstaPay';
    completePayment(methodName);
  };

  const completePayment = async (method: string) => {
    // Get or create customer
    const customer = getOrCreateCustomer(customerName, customerPhone);
    
    // Decrease inventory stock for inventory items
    cart.forEach(item => {
      if (item.isInventoryItem) {
        const inventoryId = item.id.replace('inventory-', '');
        decreaseInventoryStock(inventoryId, item.quantity);
        
        // Check if stock is low after decrease
        const updatedItem = inventory.find(i => i.id === inventoryId);
        if (updatedItem && updatedItem.stock <= updatedItem.minStock) {
          NotificationManager.notifyLowStock(updatedItem.name, updatedItem.stock);
        }
      }
    });

    const serviceName = cart.map(item => `${item.name} (${item.quantity})`).join(', ');
    
    // Update existing appointment to completed if customer has a confirmed appointment today
    const todayDate = new Date().toLocaleDateString('en-CA');
    const customerAppointmentToday = appointments.find(apt => 
      apt.customerPhone === customerPhone && 
      new Date(apt.date).toLocaleDateString('en-CA') === todayDate &&
      (apt.status === 'مؤكد' || apt.status === 'confirmed')
    );
    
    if (customerAppointmentToday) {
      updateAppointment(customerAppointmentToday.id, { status: 'منتهي' });
    }
    
    // Determine status based on next appointment
    const invoiceStatus = (nextAppointmentDate && nextAppointmentTime) ? 'غير مكتمل' : 'مكتمل';
    
    const saleData = {
      customer: customerName,
      customerPhone: customerPhone,
      service: serviceName,
      amount: total,
      discount: discountAmount,
      status: invoiceStatus,
      date: new Date().toLocaleDateString('en-CA'),
      items: cart.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        customPrice: item.customPrice,
        notes: item.notes
      })),
      paymentMethod: method,
      shiftId: currentShift?.id,
      subtotal,
    };

    await addSale(saleData);

    // Send sale notification
    NotificationManager.notifyNewSale(total, customerName);

    // Create next appointment if date and time are set
    if (nextAppointmentDate && nextAppointmentTime) {
      addAppointment({
        customer: customerName,
        customerPhone: customerPhone,
        service: serviceName,
        time: nextAppointmentTime,
        duration: '60 دقيقة',
        status: 'مؤكد',
        specialist: nextAppointmentSpecialist || 'غير محدد',
        date: new Date(nextAppointmentDate).toISOString(),
        customerImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      });

      // Send appointment notification
      NotificationManager.notifyNewAppointment(
        customerName,
        serviceName,
        `${new Date(nextAppointmentDate).toLocaleDateString('ar-EG')} - ${nextAppointmentTime}`
      );
    }

    // Translate payment method and status to English for invoice
    const paymentMethodEnglish = method === 'نقدي' ? 'Cash' : method === 'بطاقة' ? 'Card' : 'InstaPay';
    const statusEnglish = invoiceStatus === 'مكتمل' ? 'Completed' : 'Incomplete';

    // Save invoice for printing
    setLastInvoice({
      ...saleData,
      paymentMethod: paymentMethodEnglish,
      status: statusEnglish,
      invoiceNumber: Date.now(),
      date: new Date().toLocaleString('en-US'),
      subtotal,
      discountAmount,
    });

    setShowInvoiceDialog(true);

    // Reset form
    setCart([]);
    setSelectedCustomer(null);
    setCustomerName('عميل نقدي');
    setCustomerPhone('0000000000');
    setDiscount('0');
    setNextAppointmentDate('');
    setNextAppointmentTime('');
    setNextAppointmentSpecialist('');
    setPaymentMethod(null);
  };

  const handlePrintInvoice = () => {
    // Add a small delay to ensure dialog is fully rendered
    setTimeout(() => {
      // Set page title for print
      const originalTitle = document.title;
      document.title = `Invoice ${lastInvoice?.invoiceNumber || ''} - Hi Salon`;
      
      // Trigger print
      window.print();
      
      // Restore original title
      setTimeout(() => {
        document.title = originalTitle;
      }, 100);
    }, 100);
  };

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900" dir="rtl">
      <Header title="المبيعات - نقطة البيع" />

      {/* Shift Closing Button - Floating Left */}
      <div className="fixed bottom-20 left-4 lg:bottom-6 lg:left-6 z-40">
        {currentShift ? (
          <Button
            onClick={() => setShowShiftClosing(true)}
            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg px-4 py-3 lg:px-6 lg:py-3 text-sm lg:text-base font-semibold touch-manipulation"
            size="lg"
          >
            <Clock className="ml-2 w-4 h-4 lg:w-5 lg:h-5" />
            تقفيل الوردية
          </Button>
        ) : (
          <Button
            onClick={() => setShowStartShiftDialog(true)}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg px-4 py-3 lg:px-6 lg:py-3 text-sm lg:text-base font-semibold touch-manipulation"
            size="lg"
          >
            <Clock className="ml-2 w-4 h-4 lg:w-5 lg:h-5" />
            فتح وردية جديدة
          </Button>
        )}
      </div>

      {/* Floating Cart Button - Right */}
      <div className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40">
        <Button
          onClick={() => setShowCartModal(true)}
          className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-2xl px-4 py-4 lg:px-8 lg:py-6 text-base lg:text-lg font-bold relative touch-manipulation active:scale-95 transition-transform"
          size="lg"
        >
          <ShoppingCart className="ml-2 w-6 h-6 lg:w-7 lg:h-7" />
          <span className="hidden sm:inline">السلة</span>
          {cart.length > 0 && (
            <>
              <span className="mr-2 hidden sm:inline">({cart.length})</span>
              <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 lg:w-8 lg:h-8 flex items-center justify-center font-bold text-xs lg:text-sm">
                {cart.length}
              </div>
            </>
          )}
          {total > 0 && (
            <span className="mr-2 lg:mr-3 bg-white/20 px-2 py-1 lg:px-3 rounded-lg text-xs lg:text-base">
              {total.toFixed(2)} ج.م
            </span>
          )}
        </Button>
      </div>

      <div className="p-6 h-[calc(100vh-88px)] overflow-y-auto">
        {/* Products Section */}
        <div className="flex flex-col h-full">
          {/* Category Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveTab(category)}
                className={`px-6 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                  activeTab === category
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto flex flex-wrap gap-6 content-start pb-24">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 dark:bg-gray-800"
                style={{ width: '270px', height: '130px', borderRadius: '14px', padding: '18px' }}
                onClick={() => addToCart(product)}
              >
                <div className="flex gap-3 h-full">
                  <img
                    src={product.image || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400'}
                    alt={product.name}
                    className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex flex-col justify-between flex-1 min-w-0">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white mb-1 text-sm truncate">{product.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{product.duration}</p>
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-base font-bold text-pink-600 dark:text-pink-400">{product.price} ج.م</span>
                      {product.type === 'inventory' && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {product.stock} متاح
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Modal */}
      {showCartModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowCartModal(false)}>
          <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-pink-500 to-purple-600">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <ShoppingCart className="w-7 h-7" />
                السلة ({cart.length} عنصر)
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCartModal(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">العناصر</h3>
                  
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
                      <ShoppingCart className="w-16 h-16 mb-4 opacity-30" />
                      <p className="text-lg">السلة فارغة</p>
                      <p className="text-sm">أضف منتجات أو خدمات للبدء</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <Card key={item.id} className="p-3 dark:bg-gray-700/50">
                          <div className="flex gap-3">
                            {/* Item Info */}
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-bold text-sm text-gray-900 dark:text-white">{item.name}</h4>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">سعر الوحدة: {item.price} ج.م</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-7 h-7 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  onClick={() => removeFromCart(item.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>

                              {/* Quantity Controls */}
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">الكمية:</span>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="w-6 h-6"
                                    onClick={() => updateQuantity(item.id, -1)}
                                  >
                                    <Minus className="w-3 h-3" />
                                  </Button>
                                  <span className="w-8 text-center text-sm font-bold text-gray-900 dark:text-white">{item.quantity}</span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="w-6 h-6"
                                    onClick={() => updateQuantity(item.id, 1)}
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>

                              {/* Custom Price */}
                              <div>
                                <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                                  سعر مخصص
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder={`${item.price}`}
                                  value={item.customPrice || ''}
                                  onChange={(e) => updateCustomPrice(item.id, e.target.value ? parseFloat(e.target.value) : undefined)}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                />
                              </div>

                              {/* Notes */}
                              <div>
                                <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                                  ملاحظات
                                </label>
                                <textarea
                                  placeholder="أضف ملاحظة..."
                                  value={item.notes || ''}
                                  onChange={(e) => updateNotes(item.id, e.target.value)}
                                  rows={1}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white resize-none"
                                />
                              </div>

                              {/* Item Total */}
                              <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-600">
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">إجمالي:</span>
                                <span className="text-sm font-bold text-pink-600 dark:text-pink-400">
                                  {((item.customPrice !== undefined ? item.customPrice : item.price) * item.quantity).toFixed(2)} ج.م
                                </span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}

                      {/* Add Custom Item */}
                      <Card className="p-3 bg-purple-50 dark:bg-purple-900/20 border-2 border-dashed border-purple-300 dark:border-purple-700">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-2">إضافة عنصر مخصص</h4>
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={customItemName}
                            onChange={(e) => setCustomItemName(e.target.value)}
                            placeholder="اسم العنصر"
                            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={customItemPrice}
                            onChange={(e) => setCustomItemPrice(e.target.value)}
                            placeholder="السعر"
                            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                          />
                          <textarea
                            placeholder="ملاحظات (اختياري)"
                            value={customItemNotes}
                            onChange={(e) => setCustomItemNotes(e.target.value)}
                            rows={1}
                            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white resize-none"
                          />
                          <Button
                            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-1.5 text-xs"
                            onClick={addCustomItem}
                          >
                            <Plus className="ml-1 w-3 h-3" />
                            إضافة العنصر
                          </Button>
                        </div>
                      </Card>
                    </div>
                  )}
                </div>

                {/* Right Column - Customer Info & Checkout */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">معلومات الفاتورة</h3>

                  {/* Customer Info - Enhanced */}
                  <Card className="p-4 dark:bg-gray-700/50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">بيانات العميل</h4>
                      {customerName !== 'عميل نقدي' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleResetToGuestCustomer}
                          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          عميل نقدي
                        </Button>
                      )}
                    </div>
                    
                    {/* Current Customer Display */}
                    <div className="mb-3 p-3 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                        <div className="flex-1">
                          <div className="font-bold text-sm text-gray-900 dark:text-white">{customerName}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">{customerPhone}</div>
                        </div>
                        {selectedCustomer?.vip && (
                          <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-bold">VIP</span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCustomerSearch(true)}
                        className="text-xs"
                      >
                        <User className="w-3 h-3 ml-1" />
                        اختيار عميل
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowQuickAddCustomer(true)}
                        className="text-xs"
                      >
                        <Plus className="w-3 h-3 ml-1" />
                        عميل جديد
                      </Button>
                    </div>

                    {/* Warning if appointment set with cash customer */}
                    {(nextAppointmentDate && nextAppointmentTime) && (customerName === 'عميل نقدي') && (
                      <div className="mt-3 p-2 bg-orange-100 dark:bg-orange-900/30 rounded text-xs text-orange-700 dark:text-orange-300">
                        ⚠️ يجب اختيار عميل مسجل لحجز موعد
                      </div>
                    )}
                  </Card>

                  {/* Discount */}
                  <Card className="p-4 dark:bg-gray-700/50">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">الخصم</h4>
                    <div className="relative">
                      <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                        placeholder="0"
                        min="0"
                        max="100"
                        className="w-full pr-10 pl-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </Card>

                  {/* Next Appointment */}
                  <Card className="p-4 dark:bg-gray-700/50">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">الموعد القادم</h4>
                    <div className="space-y-2">
                      <input
                        type="date"
                        value={nextAppointmentDate}
                        onChange={(e) => setNextAppointmentDate(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      />
                      <input
                        type="time"
                        value={nextAppointmentTime}
                        onChange={(e) => setNextAppointmentTime(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      />
                      <input
                        type="text"
                        value={nextAppointmentSpecialist}
                        onChange={(e) => setNextAppointmentSpecialist(e.target.value)}
                        placeholder="اسم المتخصص (اختياري)"
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </Card>

                  {/* Totals */}
                  <Card className="p-4 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 dark:bg-gray-700/50">
                    <div className="space-y-3">
                      <div className="flex justify-between text-gray-700 dark:text-gray-300">
                        <span>المجموع الفرعي</span>
                        <span className="font-bold">{subtotal.toFixed(2)} ج.م</span>
                      </div>
                      {parseFloat(discount) > 0 && (
                        <div className="flex justify-between text-green-600 dark:text-green-400">
                          <span>الخصم ({discount}%)</span>
                          <span className="font-bold">-{discountAmount.toFixed(2)} ج.م</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xl font-bold border-t pt-3 border-gray-300 dark:border-gray-600">
                        <span className="text-gray-900 dark:text-white">الإجمالي</span>
                        <span className="text-pink-600 dark:text-pink-400">{total.toFixed(2)} ج.م</span>
                      </div>
                    </div>
                  </Card>

                  {/* Checkout Button */}
                  <Button
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-6 text-lg font-bold"
                    onClick={handleCheckout}
                    disabled={cart.length === 0}
                  >
                    <CreditCard className="ml-2 w-5 h-5" />
                    إتمام الدفع
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Payment Dialog */}
      {showPaymentDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPaymentDialog(false)}>
          <Card className="w-96 p-6 dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">طريقة الدفع</h3>
            
            <div className="space-y-3 mb-6">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                  paymentMethod === 'cash'
                    ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-pink-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Banknote className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                  <span className="font-medium text-gray-900 dark:text-white">نقدي</span>
                </div>
                {paymentMethod === 'cash' && <Check className="w-5 h-5 text-pink-600 dark:text-pink-400" />}
              </button>

              <button
                onClick={() => setPaymentMethod('card')}
                className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                  paymentMethod === 'card'
                    ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-pink-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                  <span className="font-medium text-gray-900 dark:text-white">بطاقة</span>
                </div>
                {paymentMethod === 'card' && <Check className="w-5 h-5 text-pink-600 dark:text-pink-400" />}
              </button>

              <button
                onClick={() => setPaymentMethod('instapay')}
                className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                  paymentMethod === 'instapay'
                    ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-pink-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Smartphone className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                  <span className="font-medium text-gray-900 dark:text-white">InstaPay</span>
                </div>
                {paymentMethod === 'instapay' && <Check className="w-5 h-5 text-pink-600 dark:text-pink-400" />}
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <div className="flex justify-between mb-1">
                <span className="text-gray-600 dark:text-gray-400">الإجمالي</span>
                <span className="font-bold text-pink-600 dark:text-pink-400">{total.toFixed(2)} ج.م</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowPaymentDialog(false);
                  setPaymentMethod(null);
                }}
              >
                إلغاء
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                onClick={confirmPayment}
              >
                تأكيد الدفع
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Invoice Dialog */}
      {showInvoiceDialog && lastInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowInvoiceDialog(false)}>
          <Card className="w-full max-w-3xl p-6 m-4 dark:bg-gray-800 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div ref={printRef} className="print-content">
              <div className="invoice-container" style={{
                maxWidth: '800px',
                margin: '0 auto',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                padding: '40px',
                background: 'white',
                fontFamily: 'Arial, sans-serif',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}>
                {/* Header with Logo and Business Info */}
                <div className="header" style={{
                  textAlign: 'center',
                  marginBottom: '30px',
                  borderBottom: '3px solid #e91e63',
                  paddingBottom: '20px'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '15px',
                    marginBottom: '15px'
                  }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '28px',
                      color: 'white',
                      fontWeight: 'bold'
                    }}>
                      H
                    </div>
                    <h1 style={{ 
                      margin: 0, 
                      color: '#e91e63', 
                      fontSize: '36px',
                      fontWeight: 'bold',
                      letterSpacing: '1px'
                    }}>
                      Hi Salon
                    </h1>
                  </div>
                  <p style={{ 
                    margin: '8px 0', 
                    color: '#6b7280',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    {systemSettings.businessName}
                  </p>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '20px',
                    marginTop: '15px',
                    flexWrap: 'wrap'
                  }}>
                    <p style={{ 
                      margin: '0', 
                      color: '#374151',
                      fontSize: '15px',
                      fontWeight: '600',
                      background: '#fce7f3',
                      padding: '6px 16px',
                      borderRadius: '20px'
                    }}>
                      Invoice #{lastInvoice.invoiceNumber}
                    </p>
                    <p style={{ 
                      margin: '0', 
                      color: '#374151',
                      fontSize: '15px',
                      fontWeight: '600',
                      background: '#f3e8ff',
                      padding: '6px 16px',
                      borderRadius: '20px'
                    }}>
                      {lastInvoice.date}
                    </p>
                  </div>
                </div>

                {/* Customer and Payment Info Cards */}
                <div className="info-section" style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '20px',
                  marginBottom: '30px'
                }}>
                  <div className="info-box" style={{ 
                    padding: '20px',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h3 style={{ 
                      margin: '0 0 15px 0', 
                      color: '#111827', 
                      fontSize: '16px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      borderBottom: '2px solid #ec4899',
                      paddingBottom: '8px',
                      display: 'inline-block'
                    }}>
                      Customer Information
                    </h3>
                    <p style={{ 
                      margin: '10px 0', 
                      fontSize: '14px', 
                      color: '#374151',
                      lineHeight: '1.8'
                    }}>
                      <strong style={{ color: '#111827' }}>Name:</strong> {lastInvoice.customer}
                    </p>
                    <p style={{ 
                      margin: '10px 0', 
                      fontSize: '14px', 
                      color: '#374151',
                      lineHeight: '1.8'
                    }}>
                      <strong style={{ color: '#111827' }}>Phone:</strong> {lastInvoice.customerPhone}
                    </p>
                  </div>
                  
                  <div className="info-box" style={{ 
                    padding: '20px',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h3 style={{ 
                      margin: '0 0 15px 0', 
                      color: '#111827', 
                      fontSize: '16px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      borderBottom: '2px solid #8b5cf6',
                      paddingBottom: '8px',
                      display: 'inline-block'
                    }}>
                      Payment Information
                    </h3>
                    <p style={{ 
                      margin: '10px 0', 
                      fontSize: '14px', 
                      color: '#374151',
                      lineHeight: '1.8'
                    }}>
                      <strong style={{ color: '#111827' }}>Method:</strong> 
                      <span style={{
                        marginLeft: '8px',
                        padding: '4px 12px',
                        background: lastInvoice.paymentMethod === 'Cash' ? '#dcfce7' : lastInvoice.paymentMethod === 'Card' ? '#dbeafe' : '#fef3c7',
                        color: lastInvoice.paymentMethod === 'Cash' ? '#166534' : lastInvoice.paymentMethod === 'Card' ? '#1e40af' : '#92400e',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: '600'
                      }}>
                        {lastInvoice.paymentMethod}
                      </span>
                    </p>
                    <p style={{ 
                      margin: '10px 0', 
                      fontSize: '14px', 
                      color: '#374151',
                      lineHeight: '1.8'
                    }}>
                      <strong style={{ color: '#111827' }}>Status:</strong> 
                      <span style={{
                        marginLeft: '8px',
                        padding: '4px 12px',
                        background: lastInvoice.status === 'Completed' ? '#dcfce7' : '#fed7aa',
                        color: lastInvoice.status === 'Completed' ? '#166534' : '#9a3412',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: '600'
                      }}>
                        {lastInvoice.status}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Items Table */}
                <table style={{
                  width: '100%',
                  borderCollapse: 'separate',
                  borderSpacing: '0',
                  marginBottom: '30px',
                  overflow: 'hidden',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <thead>
                    <tr>
                      <th style={{ 
                        padding: '16px 12px', 
                        textAlign: 'left', 
                        background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                        fontWeight: 'bold', 
                        color: 'white',
                        fontSize: '14px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        borderBottom: 'none'
                      }}>
                        Item
                      </th>
                      <th style={{ 
                        padding: '16px 12px', 
                        textAlign: 'center', 
                        background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                        fontWeight: 'bold', 
                        color: 'white',
                        fontSize: '14px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        borderBottom: 'none'
                      }}>
                        Quantity
                      </th>
                      <th style={{ 
                        padding: '16px 12px', 
                        textAlign: 'right', 
                        background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                        fontWeight: 'bold', 
                        color: 'white',
                        fontSize: '14px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        borderBottom: 'none'
                      }}>
                        Price
                      </th>
                      <th style={{ 
                        padding: '16px 12px', 
                        textAlign: 'right', 
                        background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                        fontWeight: 'bold', 
                        color: 'white',
                        fontSize: '14px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        borderBottom: 'none'
                      }}>
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {lastInvoice.items?.flatMap((item: any, index: number) => {
                      const rows = [
                        <tr key={`item-${index}`} style={{
                          background: index % 2 === 0 ? 'white' : '#f9fafb'
                        }}>
                          <td style={{ 
                            padding: '14px 12px', 
                            textAlign: 'left', 
                            borderBottom: item.notes ? 'none' : '1px solid #e5e7eb',
                            color: '#111827',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}>
                            {item.name}
                          </td>
                          <td style={{ 
                            padding: '14px 12px', 
                            textAlign: 'center', 
                            borderBottom: item.notes ? 'none' : '1px solid #e5e7eb',
                            color: '#374151',
                            fontSize: '14px'
                          }}>
                            {item.quantity}
                          </td>
                          <td style={{ 
                            padding: '14px 12px', 
                            textAlign: 'right', 
                            borderBottom: item.notes ? 'none' : '1px solid #e5e7eb',
                            color: '#374151',
                            fontSize: '14px'
                          }}>
                            {item.price.toFixed(2)} EGP
                          </td>
                          <td style={{ 
                            padding: '14px 12px', 
                            textAlign: 'right', 
                            borderBottom: item.notes ? 'none' : '1px solid #e5e7eb',
                            color: '#111827',
                            fontSize: '14px',
                            fontWeight: '600'
                          }}>
                            {(item.quantity * item.price).toFixed(2)} EGP
                          </td>
                        </tr>
                      ];
                      
                      if (item.notes) {
                        rows.push(
                          <tr key={`note-${index}`} style={{
                            background: index % 2 === 0 ? 'white' : '#f9fafb'
                          }}>
                            <td colSpan={4} style={{
                              padding: '0 12px 14px 12px',
                              textAlign: 'left',
                              borderBottom: '1px solid #e5e7eb',
                              fontSize: '12px',
                              color: '#6b7280',
                              fontStyle: 'italic'
                            }}>
                              Note: {item.notes}
                            </td>
                          </tr>
                        );
                      }
                      
                      return rows;
                    })}
                  </tbody>
                </table>

                {/* Totals Section */}
                <div className="totals" style={{ 
                  textAlign: 'right', 
                  marginTop: '30px',
                  padding: '20px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ 
                    margin: '12px 0', 
                    fontSize: '16px', 
                    color: '#6b7280',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontWeight: '500' }}>Subtotal:</span>
                    <span style={{ fontWeight: '600', color: '#374151' }}>{lastInvoice.subtotal.toFixed(2)} EGP</span>
                  </div>
                  {lastInvoice.discount > 0 && (
                    <div style={{ 
                      margin: '12px 0', 
                      fontSize: '16px', 
                      color: '#059669',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontWeight: '500' }}>Discount ({lastInvoice.discount}%):</span>
                      <span style={{ fontWeight: '600' }}>-{lastInvoice.discountAmount.toFixed(2)} EGP</span>
                    </div>
                  )}
                  <div className="total-line" style={{ 
                    fontSize: '22px', 
                    fontWeight: 'bold', 
                    background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    borderTop: '3px solid #e91e63', 
                    paddingTop: '15px', 
                    marginTop: '15px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>Total Amount:</span>
                    <span>{lastInvoice.amount.toFixed(2)} EGP</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="footer" style={{
                  textAlign: 'center',
                  marginTop: '40px',
                  paddingTop: '20px',
                  borderTop: '2px solid #e5e7eb',
                  color: '#6b7280',
                  fontSize: '13px'
                }}>
                  <p style={{ 
                    margin: '8px 0',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    {systemSettings.invoiceSettings.footerText}
                  </p>
                  <p style={{ 
                    margin: '8px 0',
                    fontSize: '13px',
                    color: '#6b7280'
                  }}>
                    {systemSettings.businessName}
                  </p>
                  <p style={{ 
                    margin: '12px 0',
                    fontSize: '13px',
                    color: '#374151',
                    fontWeight: '500'
                  }}>
                    32 Salim Ghattas St., branching from Salim El Awal, Helmia El Zaitoun
                  </p>
                  <p style={{ 
                    margin: '12px 0 0 0',
                    fontSize: '12px',
                    color: '#9ca3af',
                    fontStyle: 'italic'
                  }}>
                    Thank you for your business! • شكراً لثقتكم
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6 no-print">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowInvoiceDialog(false)}
              >
                إغلاق
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                onClick={handlePrintInvoice}
              >
                <Printer className="ml-2 w-4 h-4" />
                طباعة الفاتورة
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Shift Closing Modal */}
      {showShiftClosing && (
        <ShiftClosingModal
          sales={todaySales}
          currentShiftId={currentShift?.id}
          currentShift={currentShift}
          onClose={() => setShowShiftClosing(false)}
        />
      )}

      {/* Start Shift Dialog */}
      {showStartShiftDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowStartShiftDialog(false)}>
          <Card className="w-96 p-6 dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">فتح وردية جديدة</h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                رصيد الكاش الافتتاحي <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="أدخل رصيد الكاش الافتتاحي"
                value={startingCash}
                onChange={(e) => setStartingCash(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-lg font-bold"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                قم بإدخال المبلغ الموجود في الدرج قبل بدء العمل
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowStartShiftDialog(false);
                  setStartingCash('');
                }}
              >
                إلغاء
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                onClick={handleStartShift}
              >
                <Clock className="ml-2 w-4 h-4" />
                فتح الوردية
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Customer Search Dialog */}
      {showCustomerSearch && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowCustomerSearch(false)}>
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-pink-500 to-purple-600">
              <h3 className="text-xl font-bold text-white">اختيار عميل</h3>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  placeholder="ابحث بالاسم، الهاتف، أو البريد الإلكتروني..."
                  className="w-full pr-10 pl-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  autoFocus
                />
              </div>
            </div>

            {/* Customers List */}
            <div className="p-4 overflow-y-auto max-h-[50vh]">
              {/* Guest Customer Option */}
              <div
                onClick={() => {
                  handleResetToGuestCustomer();
                  setShowCustomerSearch(false);
                }}
                className="p-4 mb-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white">عميل نقدي</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">للمبيعات السريعة بدون تسجيل</div>
                  </div>
                </div>
              </div>

              {/* Registered Customers */}
              {filteredCustomers.length > 0 ? (
                <div className="space-y-2">
                  {filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => handleSelectCustomer(customer)}
                      className="p-4 bg-white dark:bg-gray-700 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/20 cursor-pointer transition-colors border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {customer.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-bold text-gray-900 dark:text-white">{customer.name}</div>
                            {customer.vip && (
                              <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-bold">VIP</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{customer.phone}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{customer.email}</div>
                          {customer.visits > 0 && (
                            <div className="text-xs text-pink-600 dark:text-pink-400 mt-1">
                              {customer.visits} زيارة • {customer.spending || 0} ج.م
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : customerSearchQuery ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <User className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>لا توجد نتائج</p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <User className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>ابدأ بالبحث عن عميل...</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCustomerSearch(false)}
              >
                إلغاء
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                onClick={() => {
                  setShowQuickAddCustomer(true);
                  setShowCustomerSearch(false);
                }}
              >
                <Plus className="ml-2 w-4 h-4" />
                إضافة عميل جديد
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Quick Add Customer Dialog */}
      {showQuickAddCustomer && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowQuickAddCustomer(false)}>
          <Card className="w-full max-w-md dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-pink-500 to-purple-600">
              <h3 className="text-xl font-bold text-white">إضافة عميل جديد</h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  الاسم <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={quickCustomerName}
                  onChange={(e) => setQuickCustomerName(e.target.value)}
                  placeholder="أدخل اسم العميل"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  رقم الهاتف <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={quickCustomerPhone}
                  onChange={(e) => setQuickCustomerPhone(e.target.value)}
                  placeholder="أدخل رقم الهاتف"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  البريد الإلكتروني (اختياري)
                </label>
                <input
                  type="email"
                  value={quickCustomerEmail}
                  onChange={(e) => setQuickCustomerEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-xs text-blue-700 dark:text-blue-300">
                💡 سيتم إضافة العميل واختياره تلقائياً للفاتورة الحالية
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowQuickAddCustomer(false);
                  setQuickCustomerName('');
                  setQuickCustomerPhone('');
                  setQuickCustomerEmail('');
                }}
              >
                إلغاء
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                onClick={handleQuickAddCustomer}
                disabled={isAddingCustomer}
              >
                <Plus className="ml-2 w-4 h-4" />
                {isAddingCustomer ? 'جاري الإضافة...' : 'إضافة العميل'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}