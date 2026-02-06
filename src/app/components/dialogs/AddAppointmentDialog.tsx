import { useState } from 'react';
import { X } from 'lucide-react';
  import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useApp } from '../../context/AppContext';

interface AddAppointmentDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function AddAppointmentDialog({ open, onClose }: AddAppointmentDialogProps) {
  const { addAppointment, customers, services, specialists } = useApp();
  const [formData, setFormData] = useState({
    customer: '',
    service: '',
    time: '',
    duration: '',
    status: 'معلق',
    specialist: '',
    date: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find(c => c.id === formData.customer);
    
    // Store date as ISO string for consistency
    const dateObj = new Date(formData.date);
    const isoDate = dateObj.toISOString();
    
    addAppointment({
      customer: customer?.name || formData.customer,
      customerPhone: customer?.phone,
      customerImage: customer?.image,
      service: formData.service,
      time: formData.time,
      duration: formData.duration,
      status: formData.status,
      specialist: formData.specialist,
      date: isoDate,
    });
    setFormData({ customer: '', service: '', time: '', duration: '', status: 'معلق', specialist: '', date: '' });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()} dir="rtl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">حجز موعد جديد</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              العميل
            </label>
            <select
              value={formData.customer}
              onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              required
              dir="rtl"
            >
              <option value="">اختر العميل</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              الخدمة
            </label>
            <select
              value={formData.service}
              onChange={(e) => {
                const selectedService = services.find(s => s.name === e.target.value);
                setFormData({ 
                  ...formData, 
                  service: e.target.value,
                  duration: selectedService?.duration || ''
                });
              }}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              required
              dir="rtl"
            >
              <option value="">اختر الخدمة</option>
              {services.map((service) => (
                <option key={service.id} value={service.name}>
                  {service.name} - {service.price} ج.م
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              الوقت
            </label>
            <Input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              المدة المتوقعة
            </label>
            <Input
              type="text"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              placeholder="60 دقيقة"
              required
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
              required
              dir="rtl"
            >
              <option value="معلق">معلق</option>
              <option value="مؤكد">مؤكد</option>
              <option value="موعد القادم">موعد القادم</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              الأخصائية (الاسم والوظيفة)
            </label>
            <Input
              type="text"
              value={formData.specialist}
              onChange={(e) => setFormData({ ...formData, specialist: e.target.value })}
              placeholder="مثال: ريم - مصففة شعر"
              required
              dir="rtl"
            />
            {specialists.length > 0 && (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                الأخصائيات المسجلات: {specialists.map(s => s.name).join('، ')}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              التاريخ
            </label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white"
            >
              حجز الموعد
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
      </div>
    </div>
  );
}