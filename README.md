# 🎨 Frontend - React Application

واجهة المستخدم لنظام إدارة مركز التجميل

---

## 📋 نظرة عامة

Frontend مبني على **React 18 + TypeScript + Vite** مع تصميم عصري بألوان وردية وبنفسجية ودعم كامل للغة العربية.

---

## 🛠️ التقنيات المستخدمة

- **React 18.3** - مكتبة UI
- **TypeScript** - Type Safety
- **Vite 6** - Build Tool سريع
- **React Router 7** - Navigation
- **Tailwind CSS v4** - Styling
- **Radix UI** - UI Components
- **Axios** - HTTP Client
- **Recharts** - Charts
- **Lucide React** - Icons
- **Sonner** - Toast Notifications
- **Motion** - Animations
- **React Hook Form** - Forms
- **date-fns** - Date Utilities

---

## 🚀 البدء السريع

### 1️⃣ التثبيت

```bash
npm install
```

### 2️⃣ إعداد Environment Variables

```bash
cp .env.example .env
```

عدّل `.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3️⃣ التشغيل

```bash
# Development mode
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

✅ التطبيق يعمل على: `http://localhost:5173`

---

## 📁 هيكل المشروع

```
src/
├── app/
│   ├── components/
│   │   ├── pages/              # صفحات التطبيق (19 صفحة)
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── POSPage.tsx
│   │   │   ├── CustomersPage.tsx
│   │   │   ├── AppointmentsPage.tsx
│   │   │   └── ...
│   │   ├── dialogs/            # Modal Dialogs
│   │   │   ├── AddCustomerDialog.tsx
│   │   │   ├── AddServiceDialog.tsx
│   │   │   └── ...
│   │   ├── ui/                 # Radix UI Components
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── table.tsx
│   │   │   └── ...
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── LoginPage.tsx
│   │   └── ...
│   ├── context/
│   │   ├── AppContext.tsx      # Global State
│   │   ├── AuthContext.tsx     # Authentication
│   │   └── MockData.ts         # Offline Data
│   ├── hooks/
│   │   ├── useNotifications.ts
│   │   └── useTranslation.ts
│   └── App.tsx                 # Main App Component
│
├── config/
│   ├── api.config.ts          # API Endpoints
│   └── app.config.ts          # App Settings
│
├── services/                   # API Services
│   ├── api.service.ts         # Axios Instance
│   ├── auth.service.ts        # Authentication
│   ├── customer.service.ts    # Customers
│   ├── service.service.ts     # Services
│   ├── appointment.service.ts # Appointments
│   ├── sale.service.ts        # Sales
│   └── ...
│
├── styles/
│   ├── index.css              # Global Styles
│   ├── theme.css              # Theme Variables
│   ├── fonts.css              # Font Imports (Cairo)
│   ├── print.css              # Print Styles
│   └── tailwind.css           # Tailwind Base
│
└── main.tsx                   # Entry Point
```

---

## 🎯 الصفحات (19 صفحة)

### Public Pages
1. **Login** - تسجيل دخول

### Protected Pages
2. **Dashboard** - لوحة التحكم
3. **POS** - نقطة البيع
4. **Invoices** - الفواتير
5. **Customers** - قائمة العملاء
6. **Customer Details** - تفاصيل عميل
7. **Appointments** - المواعيد
8. **Services** - الخدمات
9. **Inventory** - المخزون
10. **Expenses** - المصروفات
11. **Shifts** - الورديات
12. **Employees** - الموظفين
13. **Employee Details** - تفاصيل موظف
14. **Attendance** - الحضور
15. **Payroll** - الرواتب
16. **Payroll Details** - تفاصي�� راتب
17. **Reports** - التقارير
18. **Settings** - الإعدادات

---

## 🔌 API Integration

### Axios Configuration

```typescript
// src/services/api.service.ts
import axios from 'axios';
import { API_BASE_URL } from '@/config/api.config';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto-add JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Example Service

```typescript
// src/services/customer.service.ts
import apiService from './api.service';
import { API_ENDPOINTS } from '@/config/api.config';

export const customerService = {
  getAll: () => apiService.get(API_ENDPOINTS.CUSTOMERS.GET_ALL),
  getById: (id: string) => apiService.get(API_ENDPOINTS.CUSTOMERS.GET_BY_ID(id)),
  create: (data: any) => apiService.post(API_ENDPOINTS.CUSTOMERS.CREATE, data),
  update: (id: string, data: any) => apiService.put(API_ENDPOINTS.CUSTOMERS.UPDATE(id), data),
  delete: (id: string) => apiService.delete(API_ENDPOINTS.CUSTOMERS.DELETE(id)),
};
```

---

## 🌐 وضع Offline

إذا لم يكن Backend متاحاً، التطبيق يعمل تلقائياً بـ **Mock Data**:

```typescript
// src/app/context/MockData.ts
export const mockCustomers = [
  { id: '1', name: 'سارة أحمد', phone: '0123456789', ... },
  { id: '2', name: 'مريم محمد', phone: '0123456788', ... },
  // ...
];

export const mockServices = [
  { id: '1', name: 'قص شعر', price: 100, ... },
  { id: '2', name: 'صبغة شعر', price: 200, ... },
  // ...
];
```

---

## 🎨 التصميم

### Theme Colors

```css
/* src/styles/theme.css */
:root {
  --primary: #ec4899;      /* Pink */
  --secondary: #a855f7;    /* Purple */
  --accent: #f97316;       /* Orange */
  --background: #fef3f9;   /* Light Pink */
  /* ... */
}
```

### Cairo Font

```css
/* src/styles/fonts.css */
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap');
```

### Tailwind Config

```css
/* src/styles/tailwind.css */
@import "tailwindcss";
```

---

## 🔐 Authentication

### Login Flow

```typescript
// src/services/auth.service.ts
export const authService = {
  login: async (username: string, password: string) => {
    const response = await apiService.post(API_ENDPOINTS.AUTH.LOGIN, {
      username,
      password,
    });
    
    const { token, user } = response.data;
    
    // Store token
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { token, user };
  },
  
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },
};
```

### Protected Routes

```tsx
// src/app/components/ProtectedRoute.tsx
export function ProtectedRoute({ children, permission }: Props) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (permission && !user.permissions[permission]) {
    return <Navigate to="/dashboard" />;
  }
  
  return <>{children}</>;
}
```

---

## 🖨️ طباعة الفواتير

```typescript
// Print invoice
const handlePrint = () => {
  window.print();
};
```

```css
/* src/styles/print.css */
@media print {
  .no-print {
    display: none !important;
  }
  /* ... */
}
```

---

## 📦 Build للإنتاج

```bash
# Build
npm run build

# Output في مجلد dist/
# dist/
# ├── index.html
# ├── assets/
# │   ├── index-[hash].js
# │   ├── index-[hash].css
# │   └── ...
# └── ...
```

### Deploy

```bash
# Preview locally
npm run preview

# Deploy to Netlify/Vercel
# ارفع مجلد dist/
```

---

## ⚙️ Environment Variables

```env
# .env
VITE_API_URL=http://localhost:5000/api

# Production
# VITE_API_URL=https://api.your-domain.com/api
```

⚠️ **مهم:** جميع المتغيرات يجب أن تبدأ بـ `VITE_`

---

## 🧪 Testing

```bash
# Run tests (إذا أضفت tests لاحقاً)
npm run test
```

---

## 📝 Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

---

## 🔧 Troubleshooting

### مشكلة: Backend غير متاح

**الحل:** التطبيق يعمل تلقائياً بـ Mock Data

### مشكلة: CORS Error

**الحل:** تأكد من `CORS_ORIGIN` في Backend `.env`:
```env
CORS_ORIGIN=http://localhost:5173
```

### مشكلة: 401 Unauthorized

**الحل:** سجّل دخول من جديد

---

## 📚 موارد إضافية

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [React Router](https://reactrouter.com/)

---

## 🎯 المميزات الرئيسية

✅ **Modern Stack** - React 18 + TypeScript + Vite
✅ **Arabic RTL** - دعم كامل للعربية
✅ **Responsive** - متجاوب مع جميع الشاشات
✅ **Offline Support** - يعمل بدون Backend
✅ **Fast** - Vite HMR سريع جداً
✅ **Type Safe** - TypeScript
✅ **Beautiful UI** - Radix + Tailwind
✅ **Print Ready** - طباعة احترافية

---

**Frontend جاهز للاستخدام! 🎨**
