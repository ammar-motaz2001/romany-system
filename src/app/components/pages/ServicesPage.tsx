import { useState } from 'react';
import { Plus, Grid, LayoutList, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import Header from '@/app/components/Header';
import AddServiceDialog from '@/app/components/dialogs/AddServiceDialog';
import { useApp } from '@/app/context/AppContext';

export default function ServicesPage() {
  const { services, searchQuery, sales, updateService, deleteService } = useApp();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState('الكل');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Calculate sales count for each service (only include services with valid id)
  const servicesWithSales = services
    .filter(service => service.id != null && String(service.id).trim() !== '' && String(service.id) !== 'undefined')
    .map(service => {
      const salesCount = sales.filter(sale =>
        sale.service.includes(service.name)
      ).length;
      return { ...service, salesCount, active: service.active !== false };
    });

  // Filter services based on search query and filter
  let filteredServices = servicesWithSales.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Apply filter
  if (filter === 'معطل') {
    filteredServices = filteredServices.filter(s => !s.active);
  } else if (filter === 'غير معطل') {
    filteredServices = filteredServices.filter(s => s.active);
  } else if (filter === 'الأكثر طلباً') {
    filteredServices = filteredServices.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0)).slice(0, 5);
  }

  const handleToggleActive = (id: string | undefined, currentActive: boolean) => {
    const safeId = id != null && String(id).trim() !== '' ? String(id) : null;
    if (!safeId || safeId === 'undefined') return;
    updateService(safeId, { active: !currentActive });
  };

  const handleDelete = async (id: string | undefined) => {
    const safeId = id != null && String(id).trim() !== '' ? String(id) : null;
    if (!safeId || safeId === 'undefined') return;
    if (!window.confirm('هل أنت متأكد من حذف هذه الخدمة؟')) return;
    setDeletingId(safeId);
    try {
      await deleteService(safeId);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900" dir="rtl">
      <Header title="الأقسام والخدمات" subtitle="قم بإدارة دفعات الخدمات والأسعار المتاحة وتحديث الحالات" />

      <div className="p-8">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة قسم جديد
            </Button>
            <div className="flex gap-2 bg-white dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-pink-100 text-pink-600' : 'text-gray-600 dark:text-gray-400'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-pink-100 text-pink-600' : 'text-gray-600 dark:text-gray-400'}`}
              >
                <LayoutList className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          {['الكل', 'معطل', 'غير معطل', 'الأكثر طلباً'].map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`px-6 py-2 rounded-xl font-medium transition-all ${
                filter === item
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {viewMode === 'grid' ? (
          /* Services Grid */
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Add New Service Card */}
            <Card 
              className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-pink-400 transition-all cursor-pointer"
              onClick={() => setShowAddDialog(true)}
            >
              <div className="h-full flex flex-col items-center justify-center p-4 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-2">
                  <Plus className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="font-medium text-sm text-gray-900 dark:text-white mb-1">إضافة قسم جديد</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  أضف قسماً جديداً للخدمات
                </p>
              </div>
            </Card>

            {/* Service Cards */}
            {filteredServices.map((service) => (
              <Card key={service.id} className="p-4 cursor-pointer hover:shadow-lg transition-all hover:scale-105 group flex flex-col">
                <img
                  src={service.image || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400'}
                  alt={service.name}
                  className="w-full h-32 object-cover rounded-lg mb-3"
                />
                {service.salesCount > 0 && (
                  <div className="absolute top-6 left-6 bg-pink-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                    {service.salesCount} مبيعات
                  </div>
                )}
                {!service.active && (
                  <div className="absolute top-6 right-6 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                    معطل
                  </div>
                )}
                <div className="flex-1 flex flex-col">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">{service.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{service.duration || service.category}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-lg font-bold text-pink-600 dark:text-pink-400">{service.price} ج.م</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleActive(service.id, service.active);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        {service.active ? (
                          <ToggleRight className="w-4 h-4 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-4 h-4 text-gray-400" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                        disabled={deletingId === String(service.id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(String(service.id));
                        }}
                      >
                        {deletingId === String(service.id) ? '...' : <Trash2 className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          /* Services List */
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="text-right py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">الخدمة</th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">القسم</th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">السعر</th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">المدة</th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">المبيعات</th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">الحالة</th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServices.map((service) => (
                    <tr key={service.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-900 dark:text-white">{service.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-gray-600 dark:text-gray-400">{service.category}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-medium text-gray-900 dark:text-white">{service.price} ج.م</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-gray-600 dark:text-gray-400">{service.duration || '-'}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-medium text-pink-600">{service.salesCount || 0}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs ${
                          service.active
                            ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                            : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                        }`}>
                          {service.active ? 'نشط' : 'معطل'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(service.id, service.active)}
                          >
                            {service.active ? (
                              <ToggleRight className="w-4 h-4 text-green-600" />
                            ) : (
                              <ToggleLeft className="w-4 h-4 text-gray-400" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            disabled={deletingId === String(service.id)}
                            onClick={() => handleDelete(String(service.id))}
                          >
                            {deletingId === String(service.id) ? 'جاري الحذف...' : <Trash2 className="w-4 h-4" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Add Service Dialog */}
      <AddServiceDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
      />
    </div>
  );
}