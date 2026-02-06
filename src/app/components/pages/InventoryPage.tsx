import { useState } from 'react';
import { Plus, AlertTriangle, Edit2, Trash2 } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import Header from '@/app/components/Header';
import AddInventoryDialog from '@/app/components/dialogs/AddInventoryDialog';
import { useApp } from '@/app/context/AppContext';

export default function InventoryPage() {
  const { inventory, searchQuery, deleteInventoryItem } = useApp();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingItem, setDeletingItem] = useState<any>(null);

  // Filter based on search query - using only real inventory data
  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate stats from real data
  const totalValue = filteredInventory.reduce((acc, item) => acc + item.stock * item.price, 0);
  const totalItems = filteredInventory.length;
  const lowStockItems = filteredInventory.filter(item => item.stock < (item.minStock || 10)).length;
  
  // Calculate total units
  const totalUnits = filteredInventory.reduce((acc, item) => acc + item.stock, 0);
  
  // Get unique categories
  const uniqueCategories = new Set(filteredInventory.map(item => item.category)).size;

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setShowAddDialog(true);
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setEditingItem(null);
  };

  const handleDelete = (item: any) => {
    setDeletingItem(item);
  };

  const confirmDelete = () => {
    if (deletingItem) {
      deleteInventoryItem(deletingItem.id);
      setDeletingItem(null);
    }
  };

  const cancelDelete = () => {
    setDeletingItem(null);
  };

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900" dir="rtl">
      <Header title="إدارة المخزون" />

      <div className="p-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-purple-100 p-3 rounded-xl text-2xl">📦</div>
              <div>
                <p className="text-sm text-gray-600 mb-1">الطلبات النشطة</p>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">8 طلبات</h3>
                <p className="text-xs text-gray-500">متابعة للطلبات</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-xl text-2xl">🔗</div>
              <div>
                <p className="text-sm text-gray-600 mb-1">إجمالي الأصناف</p>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{totalItems} صنف</h3>
                <p className="text-xs text-gray-500">في {uniqueCategories} أصناف مختلفة</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-yellow-100 p-3 rounded-xl text-2xl">⚠️</div>
              <div>
                <p className="text-sm text-gray-600 mb-1">منتجات منخفضة الكمية</p>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{lowStockItems} منتج</h3>
                <p className="text-xs text-gray-500">تحتاج إلى إعادة الورود</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-pink-100 p-3 rounded-xl text-2xl">💰</div>
              <div>
                <p className="text-sm text-gray-600 mb-1">إجمالي قيمة المخزون</p>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{totalValue.toFixed(0)} ج.م</h3>
                <p className="text-xs text-gray-500">+2.4% عن الشهر الماضي</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Actions */}
        <div className="mb-6">
          <Button 
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="w-4 h-4 ml-2" />
            إضافة منتج جديد
          </Button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredInventory.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="flex items-center gap-3 p-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div>
                  <h4 className="font-medium text-gray-900">{item.name}</h4>
                  <p className="text-xs text-gray-500">{item.category}</p>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                    {item.category}
                  </span>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      item.stock >= (item.minStock || 10)
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {item.stock >= (item.minStock || 10) ? 'متوفر' : 'كمية منخفضة'}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">الكمية: <span className="font-semibold text-gray-900 dark:text-white">{item.stock} وحدة</span></p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">سعر الوحدة: <span className="font-semibold text-gray-900 dark:text-white">{item.price} ج.م</span></p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">القيمة الإجمالية: <span className="font-semibold text-pink-600 dark:text-pink-400">{(item.stock * item.price).toFixed(0)} ج.م</span></p>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-pink-600 border-pink-600 hover:bg-pink-50"
                    onClick={() => handleEdit(item)}
                  >
                    <Edit2 className="w-4 h-4 ml-1" />
                    تعديل
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(item)}
                  >
                    <Trash2 className="w-4 h-4 ml-1" />
                    حذف
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Add Inventory Dialog */}
      <AddInventoryDialog
        open={showAddDialog}
        onClose={handleCloseDialog}
        editingItem={editingItem}
      />

      {/* Delete Confirmation Dialog */}
      {deletingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={cancelDelete}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="flex flex-col items-center text-center">
              <div className="bg-red-100 p-4 rounded-full mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                هل أنت متأكد من الحذف؟
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                سيتم حذف المنتج "{deletingItem.name}" نهائياً من المخزون. هذا الإجراء لا يمكن التراجع عنه.
              </p>
              <div className="flex gap-3 w-full">
                <Button
                  onClick={confirmDelete}
                  className="flex-1 bg-red-600 text-white hover:bg-red-700"
                >
                  نعم، احذف المنتج
                </Button>
                <Button
                  variant="outline"
                  onClick={cancelDelete}
                  className="flex-1"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}