import { useApp } from '@/app/context/AppContext';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Search, Mail, Phone, Edit2, Trash2, X } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import Header from '@/app/components/Header';
import AddCustomerDialog from '@/app/components/dialogs/AddCustomerDialog';

export default function CustomersPage() {
  const { customers, searchQuery, updateCustomer, deleteCustomer } = useApp();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<any>(null);
  const navigate = useNavigate();

  // Calculate stats from actual data
  const totalCustomers = customers.length;
  const vipCustomers = customers.filter(c => c.vip).length;
  const totalSpending = customers.reduce((sum, c) => sum + (c.spending || 0), 0);
  const averageSpending = totalCustomers > 0 ? totalSpending / totalCustomers : 0;

  // Filter customers based on search query
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditCustomer = (customer: any) => {
    setEditingCustomer(customer);
  };

  const handleSaveEdit = () => {
    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        name: editingCustomer.name,
        email: editingCustomer.email,
        phone: editingCustomer.phone,
        vip: editingCustomer.vip,
      });
      setEditingCustomer(null);
    }
  };

  const handleDeleteCustomer = (customer: any) => {
    setDeletingCustomer(customer);
  };

  const confirmDelete = () => {
    if (deletingCustomer) {
      deleteCustomer(deletingCustomer.id);
      setDeletingCustomer(null);
    }
  };

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900" dir="rtl">
      <Header title="إدارة العملاء" />

      <div className="p-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 dark:bg-gray-800">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">إجمالي العملاء</p>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{totalCustomers}</h3>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-xl">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 dark:bg-gray-800">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">عملاء VIP</p>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{vipCustomers}</h3>
              </div>
              <div className="bg-pink-100 dark:bg-pink-900 p-3 rounded-xl">
                <span className="text-2xl">⭐</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 dark:bg-gray-800">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">عملاء جدد (هذا الشهر)</p>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {customers.filter(c => !c.visits || c.visits < 3).length}
                </h3>
              </div>
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-xl">
                <span className="text-2xl">✨</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 dark:bg-gray-800">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">متوسط الإنفاق</p>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{averageSpending.toFixed(0)} ج.م</h3>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-xl">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="w-4 h-4 ml-2" />
            إضافة عميل جديد
          </Button>

          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="البحث عن عميل..."
              className="pr-10 w-96 dark:bg-gray-800 dark:text-white"
              dir="rtl"
            />
          </div>
        </div>

        {/* Customers Table */}
        <Card className="overflow-hidden dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="text-right py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-300">العميل</th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-300">معلومات الاتصال</th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-300">عدد الزيارات</th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-300">الإنفاق الإجمالي</th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-300">الحالة</th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-300">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr 
                    key={customer.id} 
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    onClick={() => navigate(`/customers/${customer.id}`)}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-semibold dark:text-white hover:text-pink-600 dark:hover:text-pink-400 transition-colors">
                            {customer.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{customer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Mail className="w-4 h-4" />
                          {customer.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Phone className="w-4 h-4" />
                          {customer.phone}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-medium text-gray-900 dark:text-white">{customer.visits || 0} زيارة</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-medium text-pink-600 dark:text-pink-400">{customer.spending || 0} ج.م</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                        نشط
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCustomer(customer);
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
                      >
                        <Edit2 className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCustomer(customer);
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
                      >
                        <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Add Customer Dialog */}
      <AddCustomerDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
      />

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
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={editingCustomer.email}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">رقم الهاتف</label>
                <input
                  type="tel"
                  value={editingCustomer.phone}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="vip"
                  checked={editingCustomer.vip}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, vip: e.target.checked })}
                  className="w-4 h-4 text-pink-600 rounded"
                />
                <label htmlFor="vip" className="text-sm font-medium dark:text-white">
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
                onClick={handleSaveEdit}
              >
                حفظ التعديلات
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Customer Dialog */}
      {deletingCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setDeletingCustomer(null)}>
          <Card className="w-[500px] p-6 dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold dark:text-white">تأكيد الحذف</h3>
              <button onClick={() => setDeletingCustomer(null)}>
                <X className="w-5 h-5 dark:text-white" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                هل أنت متأكد من أنك تريد حذف العميل <strong>{deletingCustomer.name}</strong>؟
              </p>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDeletingCustomer(null)}
              >
                إلغاء
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                onClick={confirmDelete}
              >
                حذف
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}