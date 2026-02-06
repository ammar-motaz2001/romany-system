import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AppProvider, useApp } from '@/app/context/AppContext';
import { NotificationProvider } from '@/app/context/NotificationContext';
import { Toaster } from 'sonner';
import Sidebar from '@/app/components/Sidebar';
import MobileSidebar from '@/app/components/MobileSidebar';
import LoginPage from '@/app/components/LoginPage';
import SupportPage from '@/app/components/pages/SupportPage';
import DashboardPage from '@/app/components/pages/DashboardPage';
import ServicesPage from '@/app/components/pages/ServicesPage';
import POSPage from '@/app/components/pages/POSPage';
import InvoicesPage from '@/app/components/pages/InvoicesPage';
import AppointmentsPage from '@/app/components/pages/AppointmentsPage';
import InventoryPage from '@/app/components/pages/InventoryPage';
import AttendancePage from '@/app/components/pages/AttendancePage';
import ReportsPage from '@/app/components/pages/ReportsPage';
import CustomersPage from '@/app/components/pages/CustomersPage';
import CustomerDetailsPage from '@/app/components/pages/CustomerDetailsPage';
import SettingsPage from '@/app/components/pages/SettingsPage';
import ExpensesPage from '@/app/components/pages/ExpensesPage';
import ShiftsPage from '@/app/components/pages/ShiftsPage';
import EmployeesPage from '@/app/components/pages/EmployeesPage';
import PayrollPage from '@/app/components/pages/PayrollPage';
import EmployeeDetailsPage from '@/app/components/pages/EmployeeDetailsPage';
import EmployeePayrollDetailsPage from '@/app/components/pages/EmployeePayrollDetailsPage';
import SuppliersPage from '@/app/components/pages/SuppliersPage';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import SafeNotificationsMonitor from '@/app/components/SafeNotificationsMonitor';
import ErrorBoundary from '@/app/components/ErrorBoundary';
import LoadingSpinner from '@/app/components/LoadingSpinner';

// Hi Salon - Main App Component

function AppLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useApp();

  if (loading) {
    return <LoadingSpinner fullScreen message="جاري تحميل البيانات من الخادم..." />;
  }

  return (
    <>
      {/* Mobile Sidebar */}
      <MobileSidebar />
      
      {/* Main Layout */}
      <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
        {/* Main Content with Mobile Padding */}
        <div className="flex-1 overflow-y-auto pt-16 lg:pt-0">
          {children}
        </div>
        
        {/* Desktop Sidebar - Right Side */}
        <Sidebar />
      </div>
    </>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Login Page */}
      <Route path="/" element={<LoginPage />} />
      
      {/* Support Page */}
      <Route path="/support" element={<SupportPage />} />
      
      {/* Dashboard Routes with Sidebar - All protected by permissions */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute permission="dashboard">
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/services"
        element={
          <ProtectedRoute permission="services">
            <AppLayout>
              <ServicesPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pos"
        element={
          <ProtectedRoute permission="sales">
            <AppLayout>
              <POSPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/invoices"
        element={
          <ProtectedRoute permission="sales">
            <AppLayout>
              <InvoicesPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/appointments"
        element={
          <ProtectedRoute permission="appointments">
            <AppLayout>
              <AppointmentsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory"
        element={
          <ProtectedRoute permission="inventory">
            <AppLayout>
              <InventoryPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance"
        element={
          <ProtectedRoute permission="attendance">
            <AppLayout>
              <AttendancePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute permission="reports">
            <AppLayout>
              <ReportsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers"
        element={
          <ProtectedRoute permission="customers">
            <AppLayout>
              <CustomersPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers/:customerId"
        element={
          <ProtectedRoute permission="customers">
            <AppLayout>
              <CustomerDetailsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute permission="settings">
            <AppLayout>
              <SettingsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/expenses"
        element={
          <ProtectedRoute permission="expenses">
            <AppLayout>
              <ExpensesPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/shifts"
        element={
          <ProtectedRoute permission="shifts">
            <AppLayout>
              <ShiftsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees"
        element={
          <ProtectedRoute permission="employees">
            <AppLayout>
              <EmployeesPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees/:employeeId"
        element={
          <ProtectedRoute permission="employees">
            <AppLayout>
              <EmployeeDetailsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees/:employeeId/payroll"
        element={
          <ProtectedRoute permission="payroll">
            <AppLayout>
              <EmployeePayrollDetailsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payroll"
        element={
          <ProtectedRoute permission="payroll">
            <AppLayout>
              <PayrollPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/suppliers"
        element={
          <ProtectedRoute permission="suppliers">
            <AppLayout>
              <SuppliersPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      {/* Remove duplicate settings route - already exists above */}

      {/* Redirect any unknown routes to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <BrowserRouter>
          <NotificationProvider>
            {/* Toaster for notifications - must be rendered first */}
            <Toaster 
              position="top-right" 
              richColors 
              closeButton
              expand={true}
              dir="rtl"
            />
            
            {/* Notifications Monitor - Must be inside both Providers */}
            <SafeNotificationsMonitor />
            
            {/* Main App Routes */}
            <AppRoutes />
          </NotificationProvider>
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;