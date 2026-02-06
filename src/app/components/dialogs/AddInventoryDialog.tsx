import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { useApp } from '@/app/context/AppContext';

interface AddInventoryDialogProps {
  open: boolean;
  onClose: () => void;
  editingItem?: any;
}

export default function AddInventoryDialog({ open, onClose, editingItem }: AddInventoryDialogProps) {
  const { addInventoryItem, updateInventoryItem } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    stock: '',
    price: '',
    minStock: '',
  });

  // Update form when editing an item
  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name,
        category: editingItem.category,
        stock: editingItem.stock.toString(),
        price: editingItem.price.toString(),
        minStock: editingItem.minStock?.toString() || '10',
      });
    } else {
      setFormData({ name: '', category: '', stock: '', price: '', minStock: '' });
    }
  }, [editingItem, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const itemData = {
      name: formData.name,
      category: formData.category,
      stock: parseInt(formData.stock),
      price: parseFloat(formData.price),
      minStock: parseInt(formData.minStock),
      image: editingItem?.image || 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400',
    };

    if (editingItem) {
      // Update existing item
      updateInventoryItem(editingItem.id, itemData);
    } else {
      // Add new item
      addInventoryItem(itemData);
    }
    
    setFormData({ name: '', category: '', stock: '', price: '', minStock: '' });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()} dir="rtl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {editingItem ? 'تعديل المنتج' : 'إضافة منتج جديد'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              اسم المنتج
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="مثال: سيروم الأرجان"
              required
              dir="rtl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              الفئة
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              required
              dir="rtl"
            >
              <option value="">اختر الفئة</option>
              <option value="منتجات العناية بالشعر">منتجات العناية بالشعر</option>
              <option value="منتجات العناية بالبشرة">منتجات العناية بالبشرة</option>
              <option value="منتجات التجميل">منتجات التجميل</option>
              <option value="أدوات التصفيف">أدوات التصفيف</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              الكمية المتوفرة
            </label>
            <Input
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              placeholder="50"
              required
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              السعر (جنيه مصري)
            </label>
            <Input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="85"
              required
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              الحد الأدنى للمخزون
            </label>
            <Input
              type="number"
              value={formData.minStock}
              onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
              placeholder="10"
              required
              min="0"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white"
            >
              {editingItem ? 'حفظ التعديلات' : 'إضافة المنتج'}
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