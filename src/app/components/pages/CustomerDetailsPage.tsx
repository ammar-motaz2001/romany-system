import { useParams, useNavigate } from 'react-router';
import { useApp } from '@/app/context/AppContext';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { ArrowRight, Mail, Phone, Calendar, DollarSign, ShoppingBag, Clock, CheckCircle, Star, Edit2, X } from 'lucide-react';
import Header from '@/app/components/Header';
import { useState } from 'react';
import { toast } from 'sonner';

export default function CustomerDetailsPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const { customers, sales, appointments, updateCustomer } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'appointments'>('overview');
  const [editingCustomer, setEditingCustomer] = useState<any>(null);

  // Find customer
  const customer = customers.find(c => c.id === customerId);

  if (!customer) {
    return (
      <div className="flex-1 bg-gray-50 dark:bg-gray-900 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">العميل غير موجود</h2>
          <Button onClick={() => navigate('/customers')}>
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة للعملاء
          </Button>
        </div>
      </div>
    );
  }

  // Get customer's sales history
  const customerSales = sales.filter(sale => sale.customerPhone === customer.phone);
  
  // Get customer's appointments
  const customerAppointments = appointments.filter(apt => 
    apt.customer === customer.name || apt.customerPhone === customer.phone
  );

  // Calculate statistics
  const totalSpent = customerSales.reduce((sum, sale) => sum + sale.amount, 0);
  const totalVisits = customer.visits || customerSales.length;
  const averageSpent = totalVisits > 0 ? totalSpent / totalVisits : 0;
  const lastVisit = customer.visitHistory && customer.visitHistory.length > 0 
    ? customer.visitHistory[customer.visitHistory.length - 1].date 
    : customerSales.length > 0 
    ? customerSales[customerSales.length - 1].date 
    : 'لا توجد زيارات';

  // Get upcoming appointments
  const upcomingAppointments = customerAppointments.filter(apt => {
    try {
      const aptDate = new Date(apt.date);
      const today = new Date();
      return aptDate > today && apt.status !== 'مكتمل' && apt.status !== 'ملغي';
    } catch {
      return false;
    }
  });

  // Get completed appointments
  const completedAppointments = customerAppointments.filter(apt => apt.status === 'مكتمل');

  // Format date
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('ar-EG', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900" dir="rtl">
      <Header title="تفاصيل العميل" />

      <div className="p-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/customers')}
          className="mb-6"
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          العودة للعملاء
        </Button>

        {/* Customer Header Card */}
        <Card className="p-8 mb-6 dark:bg-gray-800">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                {customer.name.charAt(0)}
              </div>
              
              {/* Info */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{customer.name}</h1>
                  {customer.vip && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full text-sm font-bold">
                      <Star className="w-4 h-4" />
                      VIP
                    </span>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Mail className="w-4 h-4" />
                    <span>{customer.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Phone className="w-4 h-4" />
                    <span>{customer.phone}</span>
                  </div>
                </div>
              </div>
            </div>

            <Button 
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white"
              onClick={() => setEditingCustomer({ ...customer })}
            >
              <Edit2 className="w-4 h-4 ml-2" />
              تعديل البيانات
            </Button>
          </div>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="p-6 dark:bg-gray-800">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">إجمالي الإنفاق</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{totalSpent.toFixed(0)} ج.م</h3>
              </div>
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-xl">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 dark:bg-gray-800">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">عدد الزيارات</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{totalVisits}</h3>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-xl">
                <ShoppingBag className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 dark:bg-gray-800">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">متوسط الإنفاق</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{averageSpent.toFixed(0)} ج.م</h3>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-xl">
                <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 dark:bg-gray-800">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">آخر زيارة</p>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  {typeof lastVisit === 'string' && lastVisit.includes('-') 
                    ? new Date(lastVisit).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })
                    : lastVisit}
                </h3>
              </div>
              <div className="bg-pink-100 dark:bg-pink-900 p-3 rounded-xl">
                <Calendar className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            نظرة عامة
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            سجل المشتريات
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'appointments'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            المواعيد ({customerAppointments.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upcoming Appointments */}
            <Card className="p-6 dark:bg-gray-800">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-pink-600" />
                المواعيد القادمة
              </h3>
              
              {upcomingAppointments.length > 0 ? (
                <div className="space-y-3">
                  {upcomingAppointments.slice(0, 3).map(apt => (
                    <div key={apt.id} className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">{apt.service}</span>
                        <span className="text-xs px-2 py-1 bg-pink-500 text-white rounded-full">{apt.status}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        {formatDate(apt.date)}
                      </div>
                      {apt.specialist && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          مع: {apt.specialist}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">لا توجد مواعيد قادمة</p>
              )}
            </Card>

            {/* Recent Visits */}
            <Card className="p-6 dark:bg-gray-800">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                آخر الزيارات
              </h3>
              
              {customer.visitHistory && customer.visitHistory.length > 0 ? (
                <div className="space-y-3">
                  {customer.visitHistory.slice(-3).reverse().map((visit, index) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">{visit.services}</span>
                        <span className="text-pink-600 dark:text-pink-400 font-bold">{visit.amount} ج.م</span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(visit.date)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : customerSales.length > 0 ? (
                <div className="space-y-3">
                  {customerSales.slice(-3).reverse().map((sale) => (
                    <div key={sale.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">{sale.service}</span>
                        <span className="text-pink-600 dark:text-pink-400 font-bold">{sale.amount} ج.م</span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(sale.date)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">لا توجد زيارات سابقة</p>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'history' && (
          <Card className="p-6 dark:bg-gray-800">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">سجل المشتريات الكامل</h3>
            
            {customerSales.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <tr>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300">التاريخ</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300">الخدمة</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300">المبلغ</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300">طريقة الدفع</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerSales.reverse().map((sale) => (
                      <tr key={sale.id} className="border-b border-gray-100 dark:border-gray-700">
                        <td className="py-4 px-4 text-gray-900 dark:text-white">
                          {formatDate(sale.date)}
                        </td>
                        <td className="py-4 px-4 text-gray-900 dark:text-white font-medium">
                          {sale.service}
                        </td>
                        <td className="py-4 px-4 text-pink-600 dark:text-pink-400 font-bold">
                          {sale.amount} ج.م
                        </td>
                        <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                          {sale.paymentMethod}
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                            مكتمل
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-12">لا توجد مشتريات سابقة</p>
            )}
          </Card>
        )}

        {activeTab === 'appointments' && (
          <Card className="p-6 dark:bg-gray-800">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">جميع المواعيد</h3>
            
            {customerAppointments.length > 0 ? (
              <div className="space-y-4">
                {customerAppointments.reverse().map((apt) => (
                  <div key={apt.id} className="p-5 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-lg">{apt.service}</h4>
                        {apt.specialist && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            الأخصائية: {apt.specialist}
                          </p>
                        )}
                      </div>
                      <span className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        apt.status === 'مكتمل' 
                          ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                          : apt.status === 'مؤكد'
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                          : apt.status === 'ملغي'
                          ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                          : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                      }`}>
                        {apt.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(apt.date)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {apt.time}
                      </div>
                      {apt.price && (
                        <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400 font-bold">
                          <DollarSign className="w-4 h-4" />
                          {apt.price} ج.م
                        </div>
                      )}
                    </div>

                    {apt.notes && (
                      <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded text-sm text-gray-700 dark:text-gray-300">
                        <strong>ملاحظات:</strong> {apt.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-12">لا توجد مواعيد</p>
            )}
          </Card>
        )}
      </div>

      {/* Edit Customer Dialog */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditingCustomer(null)}>
          <Card className="w-[500px] p-6 dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold dark:text-white">تعديل بيانات العميل</h3>
              <button onClick={() => setEditingCustomer(null)}>
                <X className="w-5 h-5 dark:text-white" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">الاسم</label>
                <input
                  type="text"
                  value={editingCustomer.name}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={editingCustomer.email}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">رقم الهاتف</label>
                <input
                  type="tel"
                  value={editingCustomer.phone}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                  dir="rtl"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="vip-edit"
                  checked={editingCustomer.vip}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, vip: e.target.checked })}
                  className="w-4 h-4 text-pink-600 rounded"
                />
                <label htmlFor="vip-edit" className="text-sm font-medium dark:text-white">
                  عميل VIP
                </label>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEditingCustomer(null)}
              >
                إلغاء
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                onClick={() => {
                  updateCustomer(editingCustomer.id, {
                    name: editingCustomer.name,
                    email: editingCustomer.email,
                    phone: editingCustomer.phone,
                    vip: editingCustomer.vip,
                  });
                  toast.success('تم تحديث بيانات العميل بنجاح! ✅');
                  setEditingCustomer(null);
                }}
              >
                حفظ التعديلات
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}