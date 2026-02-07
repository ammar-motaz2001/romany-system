import { useState } from 'react';
import { Settings, User, Bell, Lock, CreditCard, Users, Upload, Eye, EyeOff, Trash2 } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Switch } from '@/app/components/ui/switch';
import Header from '@/app/components/Header';
import { useApp } from '@/app/context/AppContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import { toast } from 'sonner';
import { authService } from '@/services/auth.service';

type SettingsTab = 'profile' | 'notifications' | 'security' | 'billing' | 'system' | 'users';

export default function SettingsPage() {
  const { currentUser, updateCurrentUser, systemSettings, updateSystemSettings, users, addUser, updateUser, deleteUser } = useApp();
  const { t, isRTL } = useTranslation();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [profileImage, setProfileImage] = useState(currentUser?.image || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100');
  const [showPassword, setShowPassword] = useState(false);
  
  // Update profile form when currentUser changes
  const [profileForm, setProfileForm] = useState({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    position: currentUser?.position || '',
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState(
    currentUser?.notificationSettings || {
      appointments: true,
      inventory: true,
      reports: true,
      payments: true,
    }
  );

  // Security Form
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // System Settings Form
  const [systemForm, setSystemForm] = useState(systemSettings);

  // User Management
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    role: 'cashier' as 'admin' | 'cashier',
    name: '',
    email: '',
    phone: '',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    position: '',
    permissions: {
      dashboard: true,
      sales: true,
      invoices: true,
      customers: true,
      appointments: true,
      inventory: false,
      services: true,
      expenses: false,
      shifts: true,
      employees: false,
      attendance: false,
      payroll: false,
      reports: false,
      suppliers: false,
      settings: false,
    },
  });
  const [userFormLoading, setUserFormLoading] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  // If no current user, show loading or redirect
  if (!currentUser) {
    return (
      <div className="flex-1 bg-gray-50 dark:bg-gray-900" dir="rtl">
        <Header title="الإعدادات" />
        <div className="p-8 text-center">
          <p className="text-gray-500">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    updateCurrentUser({
      ...profileForm,
      image: profileImage,
    });
    alert('تم حفظ التغييرات بنجاح!');
  };

  const handleSaveNotifications = () => {
    updateCurrentUser({
      notificationSettings,
    });
    alert('تم حفظ إعدادات الإشعارات بنجاح!');
  };

  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleUpdatePassword = async () => {
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      toast.error('كلمة المرور الجديدة وتأكيدها غير متطابقين');
      return;
    }
    if (!securityForm.newPassword || securityForm.newPassword.trim().length < 5) {
      toast.error('كلمة المرور الجديدة مطلوبة (5 أحرف على الأقل)');
      return;
    }
    if (!currentUser?.id) {
      toast.error('لم يتم التعرف على المستخدم');
      return;
    }
    if (!securityForm.currentPassword?.trim()) {
      toast.error('كلمة المرور الحالية مطلوبة لتغيير كلمة المرور');
      return;
    }
    try {
      setPasswordLoading(true);
      await authService.changePassword(currentUser.id, {
        newPassword: securityForm.newPassword,
        currentPassword: securityForm.currentPassword,
      });
      setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('تم تحديث كلمة المرور بنجاح');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      const msg = err.response?.data?.error ?? 'حدث خطأ أثناء تغيير كلمة المرور';
      toast.error(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSaveSystemSettings = () => {
    updateSystemSettings(systemForm);
    alert('تم حفظ إعدادات النظام بنجاح!');
  };

  const handleAddUser = async () => {
    if (!userForm.username?.trim()) {
      toast.error('اسم المستخدم مطلوب');
      return;
    }
    if (!userForm.password && !editingUser) {
      toast.error('كلمة المرور مطلوبة');
      return;
    }
    if (userForm.password && userForm.password.length < 5) {
      toast.error('كلمة المرور يجب أن تكون 5 أحرف على الأقل');
      return;
    }
    if (!userForm.name?.trim()) {
      toast.error('الاسم مطلوب');
      return;
    }
    if (!userForm.email?.trim()) {
      toast.error('البريد الإلكتروني مطلوب');
      return;
    }
    if (!userForm.phone?.trim()) {
      toast.error('رقم الهاتف مطلوب');
      return;
    }

    const permissions = userForm.role === 'admin'
      ? {
          dashboard: true,
          sales: true,
          invoices: true,
          customers: true,
          appointments: true,
          inventory: true,
          services: true,
          expenses: true,
          shifts: true,
          employees: true,
          attendance: true,
          payroll: true,
          reports: true,
          suppliers: true,
          settings: true,
        }
      : { ...userForm.permissions, suppliers: userForm.permissions.suppliers ?? false };

    const newUser = {
      ...userForm,
      permissions,
    };

    if (editingUser) {
      try {
        setUserFormLoading(true);
        await updateUser(editingUser.id, newUser);
        setShowAddUserDialog(false);
        setEditingUser(null);
        resetUserForm();
      } catch {
        // Error already shown by context
      } finally {
        setUserFormLoading(false);
      }
      return;
    }

    try {
      setUserFormLoading(true);
      await addUser(newUser);
      setShowAddUserDialog(false);
      setEditingUser(null);
      resetUserForm();
    } catch {
      // Error already shown by context
    } finally {
      setUserFormLoading(false);
    }
  };

  const resetUserForm = () => {
    setUserForm({
      username: '',
      password: '',
      role: 'cashier',
      name: '',
      email: '',
      phone: '',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      position: '',
      permissions: {
        dashboard: true,
        sales: true,
        invoices: true,
        customers: true,
        appointments: true,
        inventory: false,
        services: true,
        expenses: false,
        shifts: true,
        employees: false,
        attendance: false,
        payroll: false,
        reports: false,
        suppliers: false,
        settings: false,
      },
    });
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      password: user.password,
      role: user.role,
      name: user.name,
      email: user.email,
      phone: user.phone,
      image: user.image,
      position: user.position,
      permissions: user.permissions,
    });
    setShowAddUserDialog(true);
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
    try {
      await deleteUser(id);
    } catch {
      // Error already shown by context (e.g. لا يمكنك حذف حسابك الخاص)
    }
  };

  const menuItems = [
    { id: 'profile', icon: User, label: 'الملف الشخصي' },
    { id: 'notifications', icon: Bell, label: 'الإشعارات' },
    { id: 'security', icon: Lock, label: 'الأمان والخصوصية' },
    { id: 'billing', icon: CreditCard, label: 'الفواتير ��الدفع' },
    { id: 'system', icon: Settings, label: 'إعدادات النظام' },
    ...(isAdmin ? [{ id: 'users', icon: Users, label: 'إدارة المستخدمين' }] : []),
  ] as const;

  return (
    <div className="flex-1 bg-gray-50" dir="rtl">
      <Header title="الإعدادات العامة" />

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar Menu */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <nav className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as SettingsTab)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-pink-50 to-purple-50 text-pink-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-pink-600' : 'text-gray-500'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">المعلومات الشخصية</h3>
                
                <div className="flex items-center gap-6 mb-8">
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="profile-image-upload"
                    />
                    <label htmlFor="profile-image-upload">
                      <Button variant="outline" size="sm" className="mb-2 cursor-pointer" asChild>
                        <span>
                          <Upload className="w-4 h-4 ml-2" />
                          تحميل صورة جديدة
                        </span>
                      </Button>
                    </label>
                    <p className="text-xs text-gray-500">JPG أو PNG. الحد اأقصى 2 ميجابايت</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">الاسم الأول</label>
                      <Input 
                        value={profileForm.firstName} 
                        onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                        dir="rtl" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">الاسم الأخير</label>
                      <Input 
                        value={profileForm.lastName} 
                        onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                        dir="rtl" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
                    <Input 
                      value={profileForm.email} 
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      type="email" 
                      dir="ltr" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">رقم الجوال</label>
                    <Input 
                      value={profileForm.phone} 
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      type="tel" 
                      dir="ltr" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">المنصب</label>
                    <Input 
                      value={profileForm.position} 
                      onChange={(e) => setProfileForm({ ...profileForm, position: e.target.value })}
                      dir="rtl" 
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button 
                    className="bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                    onClick={handleSaveProfile}
                  >
                    حفظ التغييرات
                  </Button>
                  <Button variant="outline">
                    إلغاء
                  </Button>
                </div>
              </Card>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">إعدادات الإشعارات</h3>
                
                <div className="space-y-4">
                  {[
                    { 
                      key: 'appointments', 
                      label: 'إشعارات المواعيد الجدية', 
                      description: 'تلقي إشعار عند حجز موعد جديد' 
                    },
                    { 
                      key: 'inventory', 
                      label: 'تنبيهات المخزون', 
                      description: 'إشعارات عند انخفاض المخزون' 
                    },
                    { 
                      key: 'reports', 
                      label: 'التقارير الأسبوعية', 
                      description: 'استلام تقرير أسبوعي عن الأداء' 
                    },
                    { 
                      key: 'payments', 
                      label: 'إشعارات الدفع', 
                      description: 'تنبيهات عند استلام المدفوعات' 
                    },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">{item.label}</h4>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                      <Switch 
                        checked={notificationSettings[item.key as keyof typeof notificationSettings]}
                        onCheckedChange={(checked) => 
                          setNotificationSettings({ 
                            ...notificationSettings, 
                            [item.key]: checked 
                          })
                        }
                      />
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 mt-6">
                  <Button 
                    className="bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                    onClick={handleSaveNotifications}
                  >
                    حفظ التغييرات
                  </Button>
                </div>
              </Card>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">الأمان والخصوصية</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">كلمة المرور الحالية</label>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={securityForm.currentPassword}
                        onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">كلمة المرور الجديدة</label>
                    <Input 
                      type="password" 
                      placeholder="••••••••"
                      value={securityForm.newPassword}
                      onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">تأكيد كلمة المرور</label>
                    <Input 
                      type="password" 
                      placeholder="••••••••"
                      value={securityForm.confirmPassword}
                      onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <h4 className="font-medium text-blue-900 mb-2">نصائح لكلمة مرور قوية:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• استخدم على الأقل 8 أحرف</li>
                      <li>• اجمع بين الأحرف الكبيرة والصغيرة</li>
                      <li>• أضف أرقام ورموز خاصة</li>
                      <li>• تجنب استخدام معلومات شخصية</li>
                    </ul>
                  </div>
                </div>

                <Button 
                  className="bg-gradient-to-r from-pink-500 to-purple-600 text-white mt-6"
                  onClick={handleUpdatePassword}
                  disabled={passwordLoading}
                >
                  {passwordLoading ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
                </Button>
              </Card>
            )}

            {/* Billing & Payment Settings */}
            {activeTab === 'billing' && (
              <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">الفواتير والدفع</h3>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">إعدادات افواتير</h4>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <div>
                          <p className="font-medium text-gray-900">عرض الشعار في الفواتير</p>
                          <p className="text-sm text-gray-500">إظهار شعار المركز في الفواتير المطبوعة</p>
                        </div>
                        <Switch 
                          checked={systemForm.invoiceSettings?.showLogo ?? true}
                          onCheckedChange={(checked) => 
                            setSystemForm({
                              ...systemForm,
                              invoiceSettings: { ...systemForm.invoiceSettings, showLogo: checked }
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <div>
                          <p className="font-medium text-gray-900">ترقيم تلقائي للفواتير</p>
                          <p className="text-sm text-gray-500">إنشاء رقم فاتورة تلقائي لكل عملية بيع</p>
                        </div>
                        <Switch 
                          checked={systemForm.invoiceSettings?.autoNumber ?? true}
                          onCheckedChange={(checked) => 
                            setSystemForm({
                              ...systemForm,
                              invoiceSettings: { ...systemForm.invoiceSettings, autoNumber: checked }
                            })
                          }
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">نص تذييل الفاتورة</label>
                        <Input 
                          value={systemForm.invoiceSettings?.footerText ?? 'شكراً لزيارتك!'}
                          onChange={(e) => 
                            setSystemForm({
                              ...systemForm,
                              invoiceSettings: { ...systemForm.invoiceSettings, footerText: e.target.value }
                            })
                          }
                          dir="rtl"
                          placeholder="شكراً لزيارتك!"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">طرق الدفع المتاحة</h4>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="border border-gray-200 rounded-lg p-4 text-center">
                        <div className="text-2xl mb-2"></div>
                        <p className="font-medium text-gray-900">نقدي</p>
                        <p className="text-xs text-gray-500 mt-1">Cash</p>
                      </div>
                      <div className="border border-gray-200 rounded-lg p-4 text-center">
                        <div className="text-2xl mb-2">💳</div>
                        <p className="font-medium text-gray-900">بطاقة</p>
                        <p className="text-xs text-gray-500 mt-1">Card</p>
                      </div>
                      <div className="border border-gray-200 rounded-lg p-4 text-center">
                        <div className="text-2xl mb-2">📱</div>
                        <p className="font-medium text-gray-900">InstaPay</p>
                        <p className="text-xs text-gray-500 mt-1">Digital</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  className="bg-gradient-to-r from-pink-500 to-purple-600 text-white mt-6"
                  onClick={handleSaveSystemSettings}
                >
                  حفظ التغييرات
                </Button>
              </Card>
            )}

            {/* System Settings */}
            {activeTab === 'system' && isAdmin && (
              <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">إعدادات النظام</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">اسم النشاط التجاري</label>
                    <Input 
                      value={systemForm.businessName ?? systemForm.shopName}
                      onChange={(e) => setSystemForm({ ...systemForm, businessName: e.target.value })}
                      dir="rtl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف</label>
                      <Input 
                        value={systemForm.businessPhone ?? systemForm.phone}
                        onChange={(e) => setSystemForm({ ...systemForm, businessPhone: e.target.value })}
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
                      <Input 
                        value={systemForm.businessEmail ?? systemForm.email}
                        onChange={(e) => setSystemForm({ ...systemForm, businessEmail: e.target.value })}
                        type="email"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">العنوان</label>
                    <Input 
                      value={systemForm.businessAddress ?? systemForm.address}
                      onChange={(e) => setSystemForm({ ...systemForm, businessAddress: e.target.value })}
                      dir="rtl"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">العملة</label>
                      <Input 
                        value={systemForm.currency}
                        onChange={(e) => setSystemForm({ ...systemForm, currency: e.target.value })}
                        dir="rtl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">اللغة</label>
                      <select
                        value={systemForm.language}
                        onChange={(e) => setSystemForm({ ...systemForm, language: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300"
                        dir="rtl"
                      >
                        <option value="ar">العربية</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">المنطقة الزمنية</label>
                      <Input 
                        value={systemForm.timezone ?? 'Africa/Cairo'}
                        onChange={(e) => setSystemForm({ ...systemForm, timezone: e.target.value })}
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">وقت بداية العمل</label>
                      <Input 
                        type="time"
                        value={systemForm.workingHours.start}
                        onChange={(e) => 
                          setSystemForm({
                            ...systemForm,
                            workingHours: { ...systemForm.workingHours, start: e.target.value }
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">وقت نهاية العمل</label>
                      <Input 
                        type="time"
                        value={systemForm.workingHours.end}
                        onChange={(e) => 
                          setSystemForm({
                            ...systemForm,
                            workingHours: { ...systemForm.workingHours, end: e.target.value }
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  className="bg-gradient-to-r from-pink-500 to-purple-600 text-white mt-6"
                  onClick={handleSaveSystemSettings}
                >
                  حفظ التغييرات
                </Button>
              </Card>
            )}

            {/* User Management (Admin Only) */}
            {activeTab === 'users' && isAdmin && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">إدارة المستخدمين</h3>
                  <Button
                    className="bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                    onClick={() => setShowAddUserDialog(true)}
                  >
                    + إضافة مستخدم جديد
                  </Button>
                </div>

                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900">{user.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              user.role === 'admin' 
                                ? 'bg-purple-100 text-purple-700' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {user.role === 'admin' ? 'أدمن' : 'كاشير'}
                            </span>
                            <span className="text-xs text-gray-500">@{user.username}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          تعديل
                        </Button>
                        {user.role !== 'admin' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit User Dialog */}
      {showAddUserDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddUserDialog(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}
              </h2>
              <button 
                onClick={() => {
                  setShowAddUserDialog(false);
                  setEditingUser(null);
                }} 
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">اسم المستخدم</label>
                  <Input
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    placeholder="username"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">كلمة المرور</label>
                  <Input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الاسم الكامل</label>
                  <Input
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المنصب</label>
                  <Input
                    value={userForm.position}
                    onChange={(e) => setUserForm({ ...userForm, position: e.target.value })}
                    dir="rtl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الدور الوظيفي</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value as 'admin' | 'cashier' })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300"
                  dir="rtl"
                >
                  <option value="cashier">كاشير</option>
                  <option value="admin">مدير</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
                  <Input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">رقم الجوال</label>
                  <Input
                    type="tel"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    dir="ltr"
                  />
                </div>
              </div>

              {userForm.role === 'cashier' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-3">تخصيص الصلاحيات - اختر الصفحات المسموح بها:</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-700">🏠 الصفحة الرئيسية</label>
                      <Switch
                        checked={userForm.permissions.dashboard}
                        onCheckedChange={(checked) =>
                          setUserForm({
                            ...userForm,
                            permissions: { ...userForm.permissions, dashboard: checked }
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-700">🛍️ المبيعات (POS)</label>
                      <Switch
                        checked={userForm.permissions.sales}
                        onCheckedChange={(checked) =>
                          setUserForm({
                            ...userForm,
                            permissions: { ...userForm.permissions, sales: checked }
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-700">📄 الفواتير</label>
                      <Switch
                        checked={userForm.permissions.invoices}
                        onCheckedChange={(checked) =>
                          setUserForm({
                            ...userForm,
                            permissions: { ...userForm.permissions, invoices: checked }
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-700">👥 العملاء</label>
                      <Switch
                        checked={userForm.permissions.customers}
                        onCheckedChange={(checked) =>
                          setUserForm({
                            ...userForm,
                            permissions: { ...userForm.permissions, customers: checked }
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-700">📅 المواعيد</label>
                      <Switch
                        checked={userForm.permissions.appointments}
                        onCheckedChange={(checked) =>
                          setUserForm({
                            ...userForm,
                            permissions: { ...userForm.permissions, appointments: checked }
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-700">📦 المخزون</label>
                      <Switch
                        checked={userForm.permissions.inventory}
                        onCheckedChange={(checked) =>
                          setUserForm({
                            ...userForm,
                            permissions: { ...userForm.permissions, inventory: checked }
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-700">💼 الأقسام والخدمات</label>
                      <Switch
                        checked={userForm.permissions.services}
                        onCheckedChange={(checked) =>
                          setUserForm({
                            ...userForm,
                            permissions: { ...userForm.permissions, services: checked }
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-700">💵 المصروفات</label>
                      <Switch
                        checked={userForm.permissions.expenses}
                        onCheckedChange={(checked) =>
                          setUserForm({
                            ...userForm,
                            permissions: { ...userForm.permissions, expenses: checked }
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-700">⏰ الورديات</label>
                      <Switch
                        checked={userForm.permissions.shifts}
                        onCheckedChange={(checked) =>
                          setUserForm({
                            ...userForm,
                            permissions: { ...userForm.permissions, shifts: checked }
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-700">👨‍💼 إدارة الموظفين</label>
                      <Switch
                        checked={userForm.permissions.employees}
                        onCheckedChange={(checked) =>
                          setUserForm({
                            ...userForm,
                            permissions: { ...userForm.permissions, employees: checked }
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-700">✅ الحضور والانصراف</label>
                      <Switch
                        checked={userForm.permissions.attendance}
                        onCheckedChange={(checked) =>
                          setUserForm({
                            ...userForm,
                            permissions: { ...userForm.permissions, attendance: checked }
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-700">💰 إدارة الرواتب</label>
                      <Switch
                        checked={userForm.permissions.payroll}
                        onCheckedChange={(checked) =>
                          setUserForm({
                            ...userForm,
                            permissions: { ...userForm.permissions, payroll: checked }
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-700">📊 التقارير</label>
                      <Switch
                        checked={userForm.permissions.reports}
                        onCheckedChange={(checked) =>
                          setUserForm({
                            ...userForm,
                            permissions: { ...userForm.permissions, reports: checked }
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-700">🚚 التجار وفواتير الشراء</label>
                      <Switch
                        checked={userForm.permissions.suppliers}
                        onCheckedChange={(checked) =>
                          setUserForm({
                            ...userForm,
                            permissions: { ...userForm.permissions, suppliers: checked }
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-700">⚙️ الإعدادات</label>
                      <Switch
                        checked={userForm.permissions.settings}
                        onCheckedChange={(checked) =>
                          setUserForm({
                            ...userForm,
                            permissions: { ...userForm.permissions, settings: checked }
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                onClick={handleAddUser}
                disabled={userFormLoading}
              >
                {userFormLoading ? 'جاري الإضافة...' : (editingUser ? 'حفظ التعديلات' : 'إضافة المستخدم')}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowAddUserDialog(false);
                  setEditingUser(null);
                }}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}