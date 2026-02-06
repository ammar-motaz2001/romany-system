import { useState } from 'react';
import { Plus, Edit, Trash2, Search, UserPlus, Phone, Briefcase, Calendar, DollarSign } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import Header from '@/app/components/Header';
import { useApp } from '@/app/context/AppContext';

export default function EmployeesPage() {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useApp();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter employees by search
  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الموظف؟ سيتم حذف جميع سجلات الحضور والرواتب المرتبطة به.')) {
      deleteEmployee(id);
    }
  };

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900" dir="rtl">
      <Header title="إدارة الموظفين" />

      <div className="p-4 sm:p-6 lg:p-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6">
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-500 p-3 rounded-xl text-white text-2xl mb-2">👥</div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">{employees.length}</h3>
              <p className="text-sm text-gray-600">إجمالي الموظفين</p>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="flex flex-col items-center text-center">
              <div className="bg-green-500 p-3 rounded-xl text-white text-2xl mb-2">✓</div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">
                {employees.filter(e => e.status === 'نشط').length}
              </h3>
              <p className="text-sm text-gray-600">موظفين نشطين</p>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
            <div className="flex flex-col items-center text-center">
              <div className="bg-orange-500 p-3 rounded-xl text-white text-2xl mb-2">⏸</div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">
                {employees.filter(e => e.status === 'موقوف').length}
              </h3>
              <p className="text-sm text-gray-600">موظفين موقوفين</p>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <div className="flex flex-col items-center text-center">
              <div className="bg-purple-500 p-3 rounded-xl text-white text-2xl mb-2">💰</div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">
                {employees.reduce((acc, emp) => acc + (emp.baseSalary || 0), 0).toLocaleString()}
              </h3>
              <p className="text-sm text-gray-600">إجمالي الرواتب</p>
            </div>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          <div className="flex gap-3">
            <Button
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white"
              onClick={() => setShowAddDialog(true)}
            >
              <UserPlus className="w-4 h-4 ml-2" />
              إضافة موظف جديد
            </Button>
          </div>

          <div className="flex-1 sm:max-w-md">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="البحث عن موظف..."
                className="pr-10"
                dir="rtl"
              />
            </div>
          </div>
        </div>

        {/* Employees Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((employee) => (
            <Card key={employee.id} className="p-6 hover:shadow-lg transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                    {employee.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{employee.name}</h3>
                    <p className="text-sm text-gray-500">{employee.position}</p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    employee.status === 'نشط'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {employee.status}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">{employee.phone}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    تاريخ التعيين: {new Date(employee.hireDate).toLocaleDateString('ar-EG')}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    نوع الراتب: {employee.salaryType}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span className="font-bold text-gray-900 dark:text-white">
                    {employee.baseSalary.toLocaleString()} ج.م
                  </span>
                </div>

                {employee.salaryType === 'بالساعة' && (
                  <div className="text-xs text-gray-500">
                    سعر الساعة: {employee.hourlyRate} ج.م
                  </div>
                )}

                {employee.commission > 0 && (
                  <div className="text-xs text-green-600">
                    عمولة: {employee.commission}%
                  </div>
                )}

                {/* Penalties Display */}
                {(employee.latePenaltyPerMinute > 0 || employee.absencePenaltyPerDay > 0 || employee.customDeductions > 0) && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-semibold text-orange-600 mb-2">الجزاءات والخصومات:</p>
                    {employee.latePenaltyPerMinute > 0 && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        🕐 التأخير: {employee.latePenaltyPerMinute} ج.م/دقيقة
                      </div>
                    )}
                    {employee.absencePenaltyPerDay > 0 && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        ❌ الغياب: {employee.absencePenaltyPerDay} ج.م/يوم
                      </div>
                    )}
                    {employee.customDeductions > 0 && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        💸 خصومات أخرى: {employee.customDeductions} ج.م
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingEmployee(employee)}
                  className="flex-1"
                >
                  <Edit className="w-3 h-3 ml-1" />
                  تعديل
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => handleDelete(employee.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {filteredEmployees.length === 0 && (
          <Card className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <UserPlus className="w-16 h-16 mx-auto mb-4" />
              <p className="text-lg">لا توجد موظفين</p>
              <p className="text-sm mt-2">ابدأ بإضافة موظف جديد</p>
            </div>
          </Card>
        )}
      </div>

      {/* Add/Edit Employee Dialog */}
      {(showAddDialog || editingEmployee) && (
        <EmployeeDialog
          employee={editingEmployee}
          onClose={() => {
            setShowAddDialog(false);
            setEditingEmployee(null);
          }}
          onSave={(employee) => {
            if (editingEmployee) {
              updateEmployee(editingEmployee.id, employee);
            } else {
              addEmployee(employee);
            }
            setShowAddDialog(false);
            setEditingEmployee(null);
          }}
        />
      )}
    </div>
  );
}

function EmployeeDialog({ employee, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    name: employee?.name || '',
    phone: employee?.phone || '',
    position: employee?.position || '',
    hireDate: employee?.hireDate || new Date().toISOString().split('T')[0],
    salaryType: employee?.salaryType || 'شهري',
    baseSalary: employee?.baseSalary || 0,
    workDays: employee?.workDays || 26,
    shiftHours: employee?.shiftHours || 8,
    hourlyRate: employee?.hourlyRate || 0,
    commission: employee?.commission || 0,
    status: employee?.status || 'نشط',
    latePenaltyPerMinute: employee?.latePenaltyPerMinute || 0,
    absencePenaltyPerDay: employee?.absencePenaltyPerDay || 0,
    customDeductions: employee?.customDeductions || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 dark:bg-gray-800" onClick={(e) => e.stopPropagation()} dir="rtl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {employee ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">البيانات الأساسية</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  اسم الموظف *
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="أدخل الاسم"
                  required
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  رقم الهاتف *
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="01xxxxxxxxx"
                  required
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  الوظيفة / التخصص *
                </label>
                <Input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="مثال: أخصائية تجميل"
                  required
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  تاريخ التعيين *
                </label>
                <Input
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Salary Info */}
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">معلومات الراتب</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  نوع الراتب *
                </label>
                <select
                  value={formData.salaryType}
                  onChange={(e) => setFormData({ ...formData, salaryType: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                  dir="rtl"
                >
                  <option value="شهري">شهري</option>
                  <option value="يومي">يومي</option>
                  <option value="بالساعة">بالساعة</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  الراتب الأساسي (ج.م) *
                </label>
                <Input
                  type="number"
                  value={formData.baseSalary}
                  onChange={(e) => setFormData({ ...formData, baseSalary: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  required
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  عدد أيام العمل (شهرياً)
                </label>
                <Input
                  type="number"
                  value={formData.workDays}
                  onChange={(e) => setFormData({ ...formData, workDays: parseInt(e.target.value) || 26 })}
                  min="1"
                  max="31"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ساعات الشيفت (يومياً)
                </label>
                <Input
                  type="number"
                  value={formData.shiftHours}
                  onChange={(e) => setFormData({ ...formData, shiftHours: parseInt(e.target.value) || 8 })}
                  min="1"
                  max="24"
                  dir="rtl"
                />
              </div>

              {formData.salaryType === 'بالساعة' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    سعر الساعة (ج.م)
                  </label>
                  <Input
                    type="number"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    dir="rtl"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  نسبة العمولة (%)
                </label>
                <Input
                  type="number"
                  value={formData.commission}
                  onChange={(e) => setFormData({ ...formData, commission: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  max="100"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  الحالة
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  dir="rtl"
                >
                  <option value="نشط">نشط</option>
                  <option value="موقوف">موقوف</option>
                </select>
              </div>
            </div>
          </div>

          {/* Penalties & Deductions */}
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">⚠️ الجزاءات والخصومات</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  خصم التأخير (ج.م / دقيقة)
                </label>
                <Input
                  type="number"
                  value={formData.latePenaltyPerMinute}
                  onChange={(e) => setFormData({ ...formData, latePenaltyPerMinute: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  step="0.1"
                  dir="rtl"
                />
                <p className="text-xs text-gray-500 mt-1">سيتم خصمها تلقائياً عند التأخير</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  خصم الغياب (ج.م / يوم)
                </label>
                <Input
                  type="number"
                  value={formData.absencePenaltyPerDay}
                  onChange={(e) => setFormData({ ...formData, absencePenaltyPerDay: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  step="0.5"
                  dir="rtl"
                />
                <p className="text-xs text-gray-500 mt-1">سيتم خصمها عند الغياب</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  خصومات أخرى (ج.م)
                </label>
                <Input
                  type="number"
                  value={formData.customDeductions}
                  onChange={(e) => setFormData({ ...formData, customDeductions: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  step="0.5"
                  dir="rtl"
                />
                <p className="text-xs text-gray-500 mt-1">خصومات ثابتة شهرية</p>
              </div>
            </div>

            <div className="mt-3 p-3 bg-orange-100 dark:bg-orange-800/30 rounded-lg">
              <p className="text-xs text-orange-800 dark:text-orange-200">
                💡 <strong>ملاحظة:</strong> هذه القيم قابلة للتخصيص لكل موظف على حدة. ستظهر تلقائياً في تقارير الرواتب والحضور والانصراف.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white"
            >
              حفظ البيانات
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              إلغاء
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
