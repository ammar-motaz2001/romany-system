import { useState } from 'react';
import { Plus, Calendar, DollarSign, FileText, Trash2, Edit, Filter } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import Header from '@/app/components/Header';
import { useApp } from '@/app/context/AppContext';

export default function ExpensesPage() {
  const { expenses, addExpense, updateExpense, deleteExpense } = useApp();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [filterMethod, setFilterMethod] = useState('الكل');

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    paymentMethod: 'نقدي',
    notes: '',
  });

  const paymentMethods = ['الكل', 'نقدي', 'بطاقة', 'تحويل بنكي'];

  const filteredExpenses = filterMethod === 'الكل' 
    ? expenses 
    : expenses.filter(e => e.paymentMethod === filterMethod);

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const handleSubmit = () => {
    if (!formData.description || !formData.amount) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (editingExpense) {
      updateExpense(editingExpense.id, {
        ...formData,
        amount: parseFloat(formData.amount),
      });
    } else {
      addExpense({
        ...formData,
        amount: parseFloat(formData.amount),
      });
    }

    setShowAddDialog(false);
    setEditingExpense(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: '',
      paymentMethod: 'نقدي',
      notes: '',
    });
  };

  const handleEdit = (expense: any) => {
    setEditingExpense(expense);
    setFormData({
      date: expense.date.split('T')[0],
      description: expense.description,
      amount: expense.amount.toString(),
      paymentMethod: expense.paymentMethod,
      notes: expense.notes || '',
    });
    setShowAddDialog(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
      deleteExpense(id);
    }
  };

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900" dir="rtl">
      <Header title="المصروفات" />

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="p-6 bg-gradient-to-br from-red-500 to-pink-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">إجمالي المصروفات</p>
                <p className="text-3xl font-bold mt-2">{totalExpenses.toFixed(2)} ج.م</p>
              </div>
              <DollarSign className="w-12 h-12 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">عدد المصروفات</p>
                <p className="text-3xl font-bold mt-2">{filteredExpenses.length}</p>
              </div>
              <FileText className="w-12 h-12 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">نقدي</p>
                <p className="text-3xl font-bold mt-2">
                  {expenses
                    .filter(e => e.paymentMethod === 'نقدي')
                    .reduce((sum, e) => sum + e.amount, 0)
                    .toFixed(2)} ج.م
                </p>
              </div>
              <DollarSign className="w-12 h-12 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-500 to-teal-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">بطاقة</p>
                <p className="text-3xl font-bold mt-2">
                  {expenses
                    .filter(e => e.paymentMethod === 'بطاقة')
                    .reduce((sum, e) => sum + e.amount, 0)
                    .toFixed(2)} ج.م
                </p>
              </div>
              <DollarSign className="w-12 h-12 opacity-50" />
            </div>
          </Card>
        </div>

        {/* Actions Bar */}
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <select
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
            >
              <Plus className="ml-2 w-5 h-5" />
              إضافة مصروف جديد
            </Button>
          </div>
        </Card>

        {/* Expenses Table */}
        <Card className="overflow-hidden dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20">
                <tr>
                  <th className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">التاريخ</th>
                  <th className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">الوصف</th>
                  <th className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">المبلغ</th>
                  <th className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">طريقة الدفع</th>
                  <th className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">الملاحظات</th>
                  <th className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      لا توجد مصروفات
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 text-gray-900 dark:text-white">
                        {new Date(expense.date).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="px-6 py-4 text-gray-900 dark:text-white">{expense.description}</td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-red-600 dark:text-red-400">
                          {expense.amount.toFixed(2)} ج.م
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          expense.paymentMethod === 'نقدي'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : expense.paymentMethod === 'بطاقة'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                        }`}>
                          {expense.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {expense.notes || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(expense)}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(expense.id)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddDialog(false)}>
          <Card className="w-full max-w-2xl p-6 m-4 dark:bg-gray-800 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
              {editingExpense ? 'تعديل مصروف' : 'إضافة مصروف جديد'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  التاريخ *
                </label>
                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full pr-10 pl-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  الوصف *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="مثال: إيجار المحل"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  المبلغ (ج.م) *
                </label>
                <div className="relative">
                  <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full pr-10 pl-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  طريقة الدفع *
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="نقدي">نقدي</option>
                  <option value="بطاقة">بطاقة</option>
                  <option value="تحويل بنكي">تحويل بنكي</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  الملاحظات
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="ملاحظات إضافية..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowAddDialog(false);
                  setEditingExpense(null);
                  setFormData({
                    date: new Date().toISOString().split('T')[0],
                    description: '',
                    amount: '',
                    paymentMethod: 'نقدي',
                    notes: '',
                  });
                }}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
              >
                {editingExpense ? 'حفظ التعديلات' : 'إضافة المصروف'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
