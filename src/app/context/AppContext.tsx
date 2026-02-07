import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
  useEffect,
} from 'react';
import { translations, Language, TranslationKey } from '@/app/translations';
import { toast } from 'sonner';

import { customerService } from '@/services/customer.service';
import { appointmentService } from '@/services/appointment.service';
import { serviceService } from '@/services/service.service';
import { saleService } from '@/services/sale.service';
import { inventoryService } from '@/services/inventory.service';
import { attendanceService } from '@/services/attendance.service';
import { employeeService } from '@/services/employee.service';
import { expenseService } from '@/services/expense.service';
import { authService } from '@/services/auth.service';
import { settingService } from '@/services/setting.service';
import { supplierService } from '@/services/supplier.service';
import { purchaseInvoiceService } from '@/services/purchaseInvoice.service';

/** Unwrap API response: backend may return { data: T } or T */
function unwrapList<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  const data = (res as { data?: unknown })?.data;
  return Array.isArray(data) ? (data as T[]) : [];
}

/** Unwrap single entity: backend may return { data: T } or T */
function unwrapData<T>(res: unknown): T | null {
  if (res == null) return null;
  const data = (res as { data?: unknown })?.data;
  return data !== undefined ? (data as T) : (res as T);
}

/** Map auth API user to AppContext User shape (used after User interface is defined) */
function mapAuthUserToContextUser(u: Record<string, unknown>): User {
  return {
    id: String(u.id ?? ''),
    username: String(u.username ?? ''),
    password: '',
    role: ((u.role as string) === 'admin' ? 'admin' : 'cashier') as User['role'],
    name: String((u as { fullName?: string }).fullName ?? u.name ?? ''),
    email: String(u.email ?? ''),
    phone: String(u.phone ?? ''),
    image: u.image as string | undefined,
    permissions: u.permissions as User['permissions'] | undefined,
  } as User;
}

interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  duration?: string;
  image?: string;
  active?: boolean;
  salesCount?: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  image?: string;
  visits?: number;
  spending?: number;
  vip?: boolean;
  visitHistory?: { date: string; services: string; amount: number }[];
}

interface Appointment {
  id: string;
  customer: string;
  customerPhone?: string;
  customerImage?: string;
  service: string;
  time: string;
  duration: string;
  status: string;
  date?: string;
  specialist?: string;
}

interface Sale {
  id: string;
  customer: string;
  customerPhone?: string;
  service: string;
  amount: number;
  discount?: number;
  status: string;
  date: string;
  category?: string;
  items?: { name: string; quantity: number; price: number; customPrice?: number; notes?: string }[];
  paymentMethod?: string;
  notes?: string;
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  price: number;
  minStock?: number;
  image?: string;
}

interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  name: string;
  position: string;
  checkIn: string;
  checkOut: string;
  workHours?: string | number;
  status: string;
  date: string;
  image?: string;
  advance?: number;
  day?: string;
  notes?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type?: string;
}

interface Specialist {
  id: string;
  name: string;
  position: string;
  image?: string;
  salary?: number;
  commission?: number;
}

interface Employee {
  id: string;
  name: string;
  phone: string;
  position: string;
  hireDate: string;
  salaryType: 'شهري' | 'يومي' | 'بالساعة';
  baseSalary: number;
  workDays: number;
  shiftHours: number;
  hourlyRate?: number;
  commission: number;
  status: 'نشط' | 'موقوف';
  latePenaltyPerMinute?: number;
  absencePenaltyPerDay?: number;
  customDeductions?: number;
}

interface Bonus {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  reason: string;
  month: number;
  year: number;
  date: string;
  addedBy?: string;
}

interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  paymentMethod: string;
  notes?: string;
  category?: string;
}

interface Supplier {
  id: string;
  name: string;
  phone: string;
  address?: string;
  balance: number; // positive = we owe them, negative = they owe us
  status: 'نشط' | 'موقوف';
  notes?: string;
}

interface PurchaseInvoice {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: { name: string; quantity: number; price: number }[];
  totalAmount: number;
  paidAmount: number;
  paymentMethod?: string;
  status: 'مدفوعة' | 'جزئي' | 'غير مدفوعة';
  notes?: string;
}

interface Shift {
  id: string;
  userId: string; // User who opened the shift
  startTime: string;
  endTime: string;
  startingCash: number;
  totalSales: number;
  totalExpenses: number;
  finalCash: number;
  status: 'open' | 'closed';
  date: string;
  cashier: string;
  salesDetails?: {
    cash: number;
    card: number;
    instapay: number;
  };
}

interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'cashier';
  name: string;
  email: string;
  phone: string;
  image?: string;
  permissions?: {
    dashboard: boolean;
    sales: boolean;
    invoices: boolean;
    customers: boolean;
    appointments: boolean;
    inventory: boolean;
    services: boolean;
    expenses: boolean;
    shifts: boolean;
    employees: boolean;
    attendance: boolean;
    payroll: boolean;
    reports: boolean;
    settings: boolean;
    suppliers: boolean;
  };
}

interface SystemSettings {
  shopName: string;
  shopLogo?: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  language: string;
  workingHours: {
    start: string;
    end: string;
  };
  notifications: boolean;
  darkMode: boolean;
  invoiceSettings?: {
    showLogo: boolean;
    showAddress: boolean;
    showPhone: boolean;
    showEmail: boolean;
    footer?: string;
    autoNumber?: boolean;
    footerText?: string;
  };
  businessName?: string;
  businessPhone?: string;
  businessEmail?: string;
  businessAddress?: string;
  timezone?: string;
}

interface AppContextType {
  // Loading states
  loading: boolean;
  
  // Services
  services: Service[];
  addService: (service: Omit<Service, 'id'>) => Promise<void>;
  updateService: (id: string, service: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  
  // Customers
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id'>) => Promise<Customer>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  getOrCreateCustomer: (phone: string, name?: string) => Customer;
  
  // Appointments
  appointments: Appointment[];
  addAppointment: (appointment: Omit<Appointment, 'id'>) => Promise<void>;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  
  // Sales
  sales: Sale[];
  addSale: (sale: Omit<Sale, 'id'>) => Promise<void>;
  
  // Inventory
  inventory: InventoryItem[];
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => Promise<void>;
  updateInventoryItem: (id: string, item: Partial<InventoryItem>) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  decreaseInventoryStock: (id: string, quantity: number) => void;
  
  // Attendance
  attendanceRecords: AttendanceRecord[];
  addAttendanceRecord: (record: Omit<AttendanceRecord, 'id'>) => Promise<void>;
  updateAttendanceRecord: (id: string, record: Partial<AttendanceRecord>) => Promise<void>;
  deleteAttendanceRecord: (id: string) => void;
  
  // Specialists
  specialists: Specialist[];
  addSpecialist: (specialist: Omit<Specialist, 'id'>) => void;
  updateSpecialist: (id: string, specialist: Partial<Specialist>) => void;
  
  // Employees
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id'>) => Promise<void>;
  updateEmployee: (id: string, employee: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  
  // Bonuses
  bonuses: Bonus[];
  addBonus: (bonus: Omit<Bonus, 'id'>) => void;
  updateBonus: (id: string, bonus: Partial<Bonus>) => void;
  deleteBonus: (id: string) => void;
  
  // Expenses
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  
  // Suppliers
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  
  // Purchase Invoices
  purchaseInvoices: PurchaseInvoice[];
  addPurchaseInvoice: (invoice: Omit<PurchaseInvoice, 'id'>) => void;
  updatePurchaseInvoice: (id: string, invoice: Partial<PurchaseInvoice>) => void;
  deletePurchaseInvoice: (id: string) => void;
  
  // Shifts
  shifts: Shift[];
  addShift: (shift: Omit<Shift, 'id' | 'userId'>) => void;
  updateShift: (id: string, shift: Partial<Shift>) => void;
  closeShift: (id: string) => void;
  
  // Notifications
  notifications: Notification[];
  markNotificationAsRead: (id: string) => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  
  // Users & Authentication
  currentUser: User | null;
  users: User[];
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
  updateCurrentUser: (user: Partial<User>) => void;
  loginUser: (userId: string) => void;
  loginWithCredentials: (credentials: { username: string; password: string }) => Promise<boolean>;
  logoutUser: () => void;
  
  // System Settings
  systemSettings: SystemSettings;
  updateSystemSettings: (settings: Partial<SystemSettings>) => Promise<void>;
  
  // Dark Mode
  darkMode: boolean;
  toggleDarkMode: () => void;
  
  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Refresh data
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const authUser = authService.getCurrentUser();
    return authUser ? mapAuthUserToContextUser(authUser as unknown as Record<string, unknown>) : null;
  });
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    shopName: '',
    address: '',
    phone: '',
    email: '',
    currency: 'ج.م',
    language: 'ar',
    workingHours: { start: '09:00', end: '21:00' },
    notifications: true,
    darkMode: false,
    invoiceSettings: {
      showLogo: true,
      showAddress: true,
      showPhone: true,
      showEmail: true,
      footer: '',
    },
  });

  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        servicesRes,
        customersRes,
        appointmentsRes,
        salesRes,
        inventoryRes,
        attendanceRes,
        employeesRes,
        expensesRes,
        settingsRes,
        usersRes,
      ] = await Promise.allSettled([
        serviceService.getAllServices(),
        customerService.getAll(),
        appointmentService.getAllAppointments(),
        saleService.getAllSales(),
        inventoryService.getAllInventory(),
        attendanceService.getAllAttendance(),
        employeeService.getAllEmployees(),
        expenseService.getAllExpenses(),
        settingService.getSettings(),
        authService.getAllUsers(),
      ]);

      setServices(
        servicesRes.status === 'fulfilled'
          ? mapBackendServicesToContext(unwrapList(servicesRes.value))
          : []
      );
      setCustomers(
        customersRes.status === 'fulfilled'
          ? mapBackendCustomersToContext(unwrapList(customersRes.value))
          : []
      );
      setAppointments(
        appointmentsRes.status === 'fulfilled'
          ? mapBackendAppointmentsToContext(unwrapList(appointmentsRes.value))
          : []
      );
      setSales(
        salesRes.status === 'fulfilled'
          ? mapBackendSalesToContext(unwrapList(salesRes.value))
          : []
      );
      setInventory(
        inventoryRes.status === 'fulfilled'
          ? unwrapList<InventoryItem>(inventoryRes.value)
          : []
      );
      setAttendanceRecords(
        attendanceRes.status === 'fulfilled'
          ? mapBackendAttendanceToContext(unwrapList(attendanceRes.value))
          : []
      );
      setEmployees(
        employeesRes.status === 'fulfilled'
          ? unwrapList<Employee>(employeesRes.value)
          : []
      );
      setExpenses(
        expensesRes.status === 'fulfilled'
          ? unwrapList<Expense>(expensesRes.value)
          : []
      );
      if (settingsRes.status === 'fulfilled' && settingsRes.value) {
        const s = settingsRes.value as Record<string, unknown>;
        setSystemSettings((prev) => ({
          ...prev,
          shopName: (s.businessName as string) ?? prev.shopName,
          address: (s.businessAddress as string) ?? prev.address,
          phone: (s.businessPhone as string) ?? prev.phone,
          email: (s.businessEmail as string) ?? prev.email,
          currency: (s.currency as string) ?? prev.currency,
          language: (s.language as string) ?? prev.language,
        }));
      }
      if (usersRes.status === 'fulfilled' && usersRes.value) {
        const list = unwrapList<Record<string, unknown>>(usersRes.value);
        setUsers(list.map((u) => mapAuthUserToContextUser(u)));
      }
      console.log('✅ تم تحميل البيانات من الخادم');
    } catch (error) {
      console.error('Error loading data:', error);
      setServices([]);
      setCustomers([]);
      setAppointments([]);
      setSales([]);
      setInventory([]);
      setAttendanceRecords([]);
      setEmployees([]);
      setExpenses([]);
      toast.error('فشل تحميل البيانات من الخادم');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data only when authenticated to avoid 401 → redirect → remount → infinite loop
  useEffect(() => {
    loadShiftsFromLocalStorage();
    if (authService.isAuthenticated()) {
      loadAllData();
    } else {
      setLoading(false);
    }
  }, [loadAllData]);

  /** Map backend customer shape (totalVisits, totalSpent) to context shape (visits, spending) */
  function mapBackendCustomersToContext(list: unknown[]): Customer[] {
    return list.map((c) => {
      const r = c as Record<string, unknown>;
      return {
        id: String(r.id ?? ''),
        name: String(r.name ?? ''),
        email: String(r.email ?? ''),
        phone: String(r.phone ?? ''),
        visits: Number((r as { totalVisits?: number }).totalVisits ?? r.visits ?? 0),
        spending: Number((r as { totalSpent?: number }).totalSpent ?? r.spending ?? 0),
        vip: Boolean((r as { vip?: boolean }).vip),
        visitHistory: Array.isArray((r as { visitHistory?: unknown }).visitHistory)
          ? (r as { visitHistory: Customer['visitHistory'] }).visitHistory
          : [],
      };
    });
  }

  /** Normalize a single sale from API (for addSale) so context gets correct shape */
  function mapBackendSaleToContext(raw: unknown, fallback: Omit<Sale, 'id'>): Sale {
    const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const dateRaw = r.date ?? r.saleDate ?? r.createdAt ?? fallback.date;
    const dateStr =
      typeof dateRaw === 'string'
        ? dateRaw.includes('T')
          ? dateRaw.split('T')[0]
          : dateRaw
        : '';
    return {
      id: String(r.id ?? r._id ?? Date.now().toString()),
      customer: String(r.customer ?? r.customerName ?? fallback.customer ?? ''),
      customerPhone: (r.customerPhone ?? fallback.customerPhone) as string | undefined,
      service: String(r.service ?? r.serviceName ?? fallback.service ?? ''),
      amount: Number(r.amount ?? r.total ?? fallback.amount ?? 0),
      discount: (r.discount ?? fallback.discount) as number | undefined,
      status: String(r.status ?? fallback.status ?? ''),
      date: dateStr || fallback.date,
      category: (r.category ?? fallback.category) as string | undefined,
      items: (r.items ?? fallback.items) as Sale['items'],
      paymentMethod: (r.paymentMethod ?? fallback.paymentMethod) as string | undefined,
      notes: (r.notes ?? fallback.notes) as string | undefined,
    };
  }

  /** Normalize backend sale shape so dashboard gets correct fields (date, amount, customer, service) */
  function mapBackendSalesToContext(list: unknown[]): Sale[] {
    return list.map((s) => {
      const r = s as Record<string, unknown>;
      const dateRaw = r.date ?? r.saleDate ?? r.createdAt;
      const dateStr =
        typeof dateRaw === 'string'
          ? dateRaw.includes('T')
            ? dateRaw.split('T')[0]
            : dateRaw
          : '';
      return {
        id: String(r.id ?? ''),
        customer: String(r.customer ?? r.customerName ?? ''),
        customerPhone: r.customerPhone as string | undefined,
        service: String(r.service ?? r.serviceName ?? r.services ?? ''),
        amount: Number(r.amount ?? r.total ?? 0),
        discount: r.discount as number | undefined,
        status: String(r.status ?? ''),
        date: dateStr,
        category: r.category as string | undefined,
        items: r.items as Sale['items'],
        paymentMethod: r.paymentMethod as string | undefined,
        notes: r.notes as string | undefined,
      };
    });
  }

  /** Normalize backend appointment shape for dashboard (date, customer, service, status) */
  function mapBackendAppointmentsToContext(list: unknown[]): Appointment[] {
    return list.map((a) => {
      const r = a as Record<string, unknown>;
      const dateRaw = r.date ?? r.appointmentDate ?? r.scheduledAt ?? r.createdAt;
      const dateStr =
        typeof dateRaw === 'string'
          ? dateRaw.includes('T')
            ? dateRaw.split('T')[0]
            : dateRaw
          : '';
      return {
        id: String(r.id ?? ''),
        customer: String(r.customer ?? r.customerName ?? ''),
        customerPhone: r.customerPhone as string | undefined,
        customerImage: r.customerImage as string | undefined,
        service: String(r.service ?? r.serviceName ?? ''),
        time: String(r.time ?? r.startTime ?? ''),
        duration: String(r.duration ?? ''),
        status: String(r.status ?? ''),
        date: dateStr,
        specialist: r.specialist as string | undefined,
      };
    });
  }

  /** Normalize backend attendance shape (date, status present/حاضر) */
  function mapBackendAttendanceToContext(list: unknown[]): AttendanceRecord[] {
    return list.map((a) => {
      const r = a as Record<string, unknown>;
      const dateRaw = r.date ?? r.attendanceDate ?? r.checkIn ?? r.createdAt;
      const dateStr =
        typeof dateRaw === 'string'
          ? dateRaw.includes('T')
            ? dateRaw.split('T')[0]
            : dateRaw
          : String(dateRaw ?? '');
      return {
        id: String(r.id ?? ''),
        employeeId: String(r.employeeId ?? ''),
        employeeName: String(r.employeeName ?? r.employee ?? r.name ?? ''),
        name: String(r.name ?? r.employeeName ?? ''),
        position: String(r.position ?? ''),
        checkIn: String(r.checkIn ?? r.checkInTime ?? ''),
        checkOut: String(r.checkOut ?? r.checkOutTime ?? ''),
        workHours: r.workHours as string | number | undefined,
        status: String(r.status ?? ''),
        date: dateStr,
        image: r.image as string | undefined,
        advance: r.advance as number | undefined,
        day: r.day as string | undefined,
        notes: r.notes as string | undefined,
      };
    });
  }

  // Load shifts from localStorage (no backend endpoint)
  const loadShiftsFromLocalStorage = () => {
    try {
      const savedShifts = localStorage.getItem('shifts');
      if (savedShifts) {
        setShifts(JSON.parse(savedShifts));
      }
    } catch (error) {
      console.error('Error loading shifts from localStorage:', error);
    }
  };

  const refreshData = async () => {
    await loadAllData();
  };

  // Helper functions to map backend data to frontend format
  const mapStatus = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      'pending': 'معلق',
      'confirmed': 'مؤكد',
      'completed': 'منتهي',
      'cancelled': 'ملغي',
      'no-show': 'لم يحضر',
      'present': 'حاضر',
      'late': 'متأخر',
      'absent': 'غائب',
      'half-day': 'نصف يوم',
      'on-leave': 'إجازة',
    };
    return statusMap[status.toLowerCase()] || status;
  };

  const mapStatusToEnglish = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      'معلق': 'pending',
      'مؤكد': 'confirmed',
      'منتهي': 'completed',
      'ملغي': 'cancelled',
      'لم يحضر': 'no-show',
      'حاضر': 'present',
      'متأخر': 'late',
      'غائب': 'absent',
      'نصف يوم': 'half-day',
      'إجازة': 'on-leave',
    };
    return statusMap[status] || status;
  };

  const mapPaymentMethod = (method: string): string => {
    const methodMap: { [key: string]: string } = {
      'cash': 'نقدي',
      'card': 'بطاقة',
      'instapay': 'InstaPay',
      'mixed': 'مختلط',
      'bank-transfer': 'تحويل بنكي',
    };
    return methodMap[method?.toLowerCase()] || method || 'نقدي';
  };

  const mapPaymentMethodToEnglish = (method: string): string => {
    const methodMap: { [key: string]: string } = {
      'نقدي': 'cash',
      'بطاقة': 'card',
      'InstaPay': 'instapay',
      'مختلط': 'mixed',
      'تحويل بنكي': 'bank-transfer',
    };
    return methodMap[method] || method || 'cash';
  };

  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  /** Normalize backend services list so every service has a string id (no undefined) */
  function mapBackendServicesToContext(list: unknown[]): Service[] {
    return list.map((item, index) => {
      const r = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
      return {
        id: String(r.id ?? r._id ?? `svc-${index}-${Date.now()}`),
        name: String(r.name ?? ''),
        category: String(r.category ?? ''),
        price: Number(r.price ?? 0),
        duration: r.duration != null ? String(r.duration) : undefined,
        image: r.image as string | undefined,
        active: r.active !== undefined ? Boolean(r.active) : true,
        salesCount: typeof r.salesCount === 'number' ? r.salesCount : 0,
      };
    });
  }

  /** Normalize backend service shape so context and المبيعات (POS) get correct fields */
  function mapBackendServiceToContext(raw: unknown, fallback: Omit<Service, 'id'>): Service {
    const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    return {
      id: String(r.id ?? r._id ?? Date.now().toString()),
      name: String(r.name ?? fallback.name ?? ''),
      category: String(r.category ?? fallback.category ?? ''),
      price: Number(r.price ?? fallback.price ?? 0),
      duration: r.duration != null ? String(r.duration) : fallback.duration,
      image: r.image as string | undefined,
      active: r.active !== undefined ? Boolean(r.active) : fallback.active !== false,
      salesCount: typeof r.salesCount === 'number' ? r.salesCount : 0,
    };
  }

  // Services functions - integrated with API (updates context so الأقسام والخدمات and المبيعات see new service)
  const addService = async (service: Omit<Service, 'id'>) => {
    try {
      const created = await serviceService.createService({
        name: service.name,
        category: service.category,
        price: service.price,
        duration: service.duration,
        image: service.image,
        active: service.active !== false,
      });
      const raw = unwrapData<Record<string, unknown>>(created) ?? (created as Record<string, unknown>);
      const resolved = mapBackendServiceToContext(raw, { ...service, active: service.active !== false });
      setServices((prev) => [...prev, resolved]);
      addNotification({
        title: 'خدمة جديدة',
        message: `تم إضافة خدمة "${service.name}" بنجاح`,
        time: 'الآن',
        read: false,
      });
      toast.success('تم إضافة الخدمة بنجاح');
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'حدث خطأ أثناء إضافة الخدمة');
      throw error;
    }
  };

  const updateService = async (id: string, service: Partial<Service>) => {
    const safeId = id == null || String(id).trim() === '' ? null : String(id);
    if (!safeId || safeId === 'undefined') {
      toast.error('معرف الخدمة غير صالح');
      return;
    }
    try {
      const updated = await serviceService.updateService(safeId, {
        name: service.name,
        category: service.category,
        price: service.price,
        duration: service.duration,
        image: service.image,
        active: service.active,
      });
      const resolved = unwrapData<Service>(updated) ?? { ...services.find((s) => String(s.id) === safeId), ...service };
      if (resolved && typeof resolved === 'object') {
        setServices((prev) =>
          prev.map((s) => (String(s.id) === safeId ? { ...s, ...resolved } : s))
        );
      }
      addNotification({
        title: 'تحديث خدمة',
        message: `تم تحديث خدمة "${service.name ?? safeId}" بنجاح`,
        time: 'الآن',
        read: false,
      });
      toast.success('تم تحديث الخدمة بنجاح');
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'حدث خطأ أثناء تحديث الخدمة');
      throw error;
    }
  };

  const deleteService = async (id: string) => {
    const safeId = id == null || String(id).trim() === '' ? null : String(id);
    if (!safeId || safeId === 'undefined') {
      toast.error('معرف الخدمة غير صالح');
      return;
    }
    const service = services.find((s) => String(s.id) === safeId);
    try {
      await serviceService.deleteService(safeId);
      setServices((prev) => prev.filter((s) => String(s.id) !== safeId));
      addNotification({
        title: 'حذف خدمة',
        message: `تم حذف خدمة "${service?.name}" بنجاح`,
        time: 'الآن',
        read: false,
      });
      toast.success('تم حذف الخدمة بنجاح');
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'حدث خطأ أثناء حذف الخدمة');
      throw error;
    }
  };

  // Customers functions - Frontend Only
  const addCustomer = async (customer: Omit<Customer, 'id'>): Promise<Customer> => {
    try {
      const res = await customerService.create({
        name: customer.name,
        phone: customer.phone,
        email: customer.email ?? '',
        totalVisits: customer.visits ?? 0,
        totalSpent: customer.spending ?? 0,
        isActive: true,
      });
      const raw = unwrapData<{ id: string; name: string; phone: string; email?: string; totalVisits?: number; totalSpent?: number }>(res) ?? res as Record<string, unknown>;
      const newCustomer: Customer = {
        id: String(raw?.id ?? Date.now()),
        name: String(raw?.name ?? customer.name),
        email: String(raw?.email ?? customer.email ?? ''),
        phone: String(raw?.phone ?? customer.phone),
        visits: Number((raw as { totalVisits?: number })?.totalVisits ?? customer.visits ?? 0),
        spending: Number((raw as { totalSpent?: number })?.totalSpent ?? customer.spending ?? 0),
        vip: customer.vip ?? false,
        visitHistory: customer.visitHistory ?? [],
      };
      setCustomers((prev) => [...prev, newCustomer]);
      addNotification({
        title: 'عميل جديد',
        message: `تم إضافة عميل جديد "${customer.name}"`,
        time: 'الآن',
        read: false,
      });
      toast.success('تم إضافة العميل بنجاح');
      return newCustomer;
    } catch (error: unknown) {
      const msg = String((error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? '');
      const isAlreadyRegistered = /مسجل|already|exists|موجود|مُسَجّل|phone/i.test(msg);
      if (!isAlreadyRegistered) {
        toast.error(msg || 'حدث خطأ أثناء إضافة العميل');
      }
      throw error;
    }
  };

  const updateCustomer = async (id: string, customer: Partial<Customer>) => {
    try {
      await customerService.update(id, {
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        totalVisits: customer.visits,
        totalSpent: customer.spending,
      });
      setCustomers((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...customer } : c))
      );
      toast.success('تم تحديث العميل بنجاح');
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'حدث خطأ أثناء تحديث العميل');
      throw error;
    }
  };

  const deleteCustomer = async (id: string) => {
    const customer = customers.find((c) => c.id === id);
    setCustomers(customers.filter((c) => c.id !== id));
    addNotification({
      title: 'حذف عميل',
      message: `تم حذف العميل "${customer?.name}" ��نجاح`,
      time: 'الآن',
      read: false,
    });
    toast.success('تم حذف العميل بنجاح');
  };

  const getOrCreateCustomer = (phone: string, name?: string): Customer => {
    let customer = customers.find((c) => c.phone === phone);
    if (!customer && name) {
      const newCustomer: Customer = {
        id: Date.now().toString(),
        name,
        email: '',
        phone,
        visits: 0,
        spending: 0,
        visitHistory: [],
      };
      // This will be handled async in the addSale function
      return newCustomer;
    }
    return customer || {
      id: 'temp',
      name: name || 'عميل نقدي',
      email: '',
      phone,
      visits: 0,
      spending: 0,
      visitHistory: [],
    };
  };

  // Appointments functions - Frontend Only
  const addAppointment = async (appointment: Omit<Appointment, 'id'>) => {
    // Find customer by phone or create new one
    let existingCustomer = customers.find(c => c.phone === appointment.customerPhone);
    
    if (!existingCustomer && appointment.customer && appointment.customerPhone && appointment.customer !== 'عميل نقدي') {
      try {
        existingCustomer = await addCustomer({
          name: appointment.customer,
          email: '',
          phone: appointment.customerPhone,
        });
      } catch (error) {
        console.error('Error creating customer:', error);
      }
    }

    const newAppointment = {
      ...appointment,
      id: Date.now().toString(),
    };
    
    setAppointments([...appointments, newAppointment]);
    addNotification({
      title: 'موعد جديد',
      message: `تم حجز موعد جديد لـ "${appointment.customer}"`,
      time: 'الآن',
      read: false,
    });
    toast.success('م إضافة الموعد بنجاح');
  };

  const updateAppointment = async (id: string, appointment: Partial<Appointment>) => {
    setAppointments(
      appointments.map((a) => (a.id === id ? { ...a, ...appointment } : a))
    );
    toast.success('تم تحديث الموعد بنجاح');
  };

  const deleteAppointment = async (id: string) => {
    setAppointments(appointments.filter((a) => a.id !== id));
    addNotification({
      title: 'تم حذف الموعد',
      message: 'تم حذف الموعد بنجاح',
      time: 'الآن',
      read: false,
    });
    toast.success('تم حذف الموعد بنجاح');
  };

  // Normalize phone for comparison (trim, optional strip non-digits)
  const normalizePhone = (phone: string) => String(phone ?? '').trim().replace(/\s/g, '');

  // Sales functions - integrated with API
  // Flow: المبيعات (POS) calls addSale → we push to context (sales) → الفواتير (Invoices) reads same sales → new invoice appears
  const addSale = async (sale: Omit<Sale, 'id'>) => {
    const salePhone = normalizePhone(sale.customerPhone ?? '');
    let customerId = customers.find((c) => normalizePhone(c.phone) === salePhone)?.id;

    if (!customerId && sale.customer && sale.customerPhone && sale.customer !== 'عميل نقدي') {
      try {
        const newCustomer = await addCustomer({
          name: sale.customer,
          email: '',
          phone: sale.customerPhone,
        });
        customerId = newCustomer.id;
      } catch (error: unknown) {
        const msg = String((error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? '');
        const isAlreadyRegistered =
          /مسجل|already|exists|موجود|مُسَجّل/i.test(msg) || msg.includes('phone');
        if (isAlreadyRegistered) {
          try {
            const listRes = await customerService.getAll();
            const list = unwrapList<Record<string, unknown>>(listRes);
            const mapped = mapBackendCustomersToContext(list);
            const existing = mapped.find((c) => normalizePhone(c.phone) === salePhone);
            if (existing) {
              customerId = existing.id;
              setCustomers((prev) => {
                const has = prev.some((c) => normalizePhone(c.phone) === salePhone);
                return has ? prev : [...prev, existing];
              });
            }
          } catch (fetchErr) {
            console.error('Error fetching existing customer:', fetchErr);
          }
        } else {
          toast.error(msg || 'حدث خطأ أثناء إضافة العميل');
          throw error;
        }
      }
    }

    try {
      const created = await saleService.createSale({
        customer: sale.customer,
        customerPhone: sale.customerPhone,
        service: sale.service,
        amount: sale.amount,
        discount: sale.discount,
        status: sale.status,
        date: sale.date,
        category: sale.category,
        items: sale.items,
        paymentMethod: sale.paymentMethod,
        notes: sale.notes,
      });
      const raw = unwrapData<Record<string, unknown>>(created) ?? (created as Record<string, unknown>);
      const newSale = mapBackendSaleToContext(raw, sale);
      setSales((prev) => [...prev, newSale]);
      if (customerId) {
        const customer = customers.find((c) => c.id === customerId);
        if (customer) {
          updateCustomer(customerId, {
            visits: (customer.visits ?? 0) + 1,
            spending: (customer.spending ?? 0) + sale.amount,
          });
        }
      }
      addNotification({
        title: 'عملية بيع جديدة',
        message: `تم إضافة عملية بيع بقيمة ${sale.amount} ج.م`,
        time: 'الآن',
        read: false,
      });
      toast.success('تم إضافة عملية البيع بنجاح');
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'حدث خطأ أثناء إضافة عملية البيع');
      throw error;
    }
  };

  // Inventory functions - integrated with API
  const addInventoryItem = async (item: Omit<InventoryItem, 'id'>) => {
    try {
      const created = await inventoryService.createInventoryItem({
        name: item.name,
        category: item.category,
        stock: item.stock,
        price: item.price,
        minStock: item.minStock,
        image: item.image,
      });
      const newItem = unwrapData<InventoryItem>(created) ?? (created as InventoryItem);
      if (newItem && typeof newItem === 'object' && 'id' in newItem) {
        setInventory((prev) => [...prev, newItem as InventoryItem]);
      }
      addNotification({
        title: 'منتج جديد في المخزون',
        message: `تم إضافة "${item.name}" إلى المخزون`,
        time: 'الآن',
        read: false,
      });
      toast.success('تم إضافة المنتج بنجاح');
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'حدث خطأ أثناء إضافة المنتج');
      throw error;
    }
  };

  const updateInventoryItem = async (id: string, item: Partial<InventoryItem>) => {
    try {
      await inventoryService.updateInventoryItem(id, {
        name: item.name,
        category: item.category,
        stock: item.stock,
        price: item.price,
        minStock: item.minStock,
        image: item.image,
      });
      setInventory((prev) =>
        prev.map((i) => (i.id === id ? { ...i, ...item } : i))
      );
      addNotification({
        title: 'تحديث مخزون',
        message: `تم تحديث بيانات المنتج "${item.name ?? id}"`,
        time: 'الآن',
        read: false,
      });
      toast.success('تم تحديث المنتج بنجاح');
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'حدث خطأ أثناء تحديث المنتج');
      throw error;
    }
  };

  const deleteInventoryItem = async (id: string) => {
    const item = inventory.find((i) => i.id === id);
    try {
      await inventoryService.deleteInventoryItem(id);
      setInventory((prev) => prev.filter((i) => i.id !== id));
      addNotification({
        title: 'حذف منتج من المخزون',
        message: `تم حذف "${item?.name}" من المخزون`,
        time: 'الآن',
        read: false,
      });
      toast.success('تم حذف المنتج بنجاح');
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'حدث خطأ أثناء حذف المنتج');
      throw error;
    }
  };

  const decreaseInventoryStock = (id: string, quantity: number) => {
    // Update locally first for immediate feedback
    setInventory(
      inventory.map((i) =>
        i.id === id ? { ...i, stock: i.stock - quantity } : i
      )
    );
    // The backend will handle this automatically when a sale is created
  };

  // Attendance functions - Frontend Only
  const addAttendanceRecord = async (record: Omit<AttendanceRecord, 'id'>) => {
    try {
      // Frontend-only mode: save to state
      const newRecord: AttendanceRecord = {
        ...record,
        id: Date.now().toString(),
      };

      setAttendanceRecords([...attendanceRecords, newRecord]);
      
      addNotification({
        title: 'تسجيل حضور',
        message: `تم تسجيل حضور "${record.name}"`,
        time: 'الآن',
        read: false,
      });
      toast.success('تم تسجيل الحضور بنجاح');
    } catch (error: any) {
      console.error('Error adding attendance record:', error);
      toast.error(error.message || 'حدث خطأ أثناء تسجيل الحضور');
      throw error;
    }
  };

  const updateAttendanceRecord = async (id: string, record: Partial<AttendanceRecord>) => {
    try {
      // Frontend-only mode: update in state
      setAttendanceRecords(
        attendanceRecords.map((r) => (r.id === id ? { ...r, ...record } : r))
      );
      toast.success('تم تحديث سجل الحضور بنجاح');
    } catch (error: any) {
      console.error('Error updating attendance record:', error);
      toast.error(error.message || 'حدث خطأ أثناء تحديث سجل الحضور');
      throw error;
    }
  };

  const deleteAttendanceRecord = (id: string) => {
    const record = attendanceRecords.find((r) => r.id === id);
    setAttendanceRecords(attendanceRecords.filter((r) => r.id !== id));
    addNotification({
      title: 'حذف سجل حضور',
      message: `تم حذف سجل حضور "${record?.name}"`,
      time: 'الآن',
      read: false,
    });
    toast.success('ت حذف سجل الحضور بنجاح');
  };

  // Specialists functions (Local only - no backend yet)
  const addSpecialist = (specialist: Omit<Specialist, 'id'>) => {
    const newSpecialist = {
      ...specialist,
      id: Date.now().toString(),
    };
    setSpecialists([...specialists, newSpecialist]);
    addNotification({
      title: 'أخصائية جديدة',
      message: `تم إضافة أخصائية "${specialist.name}"`,
      time: 'الآن',
      read: false,
    });
    toast.success('تم إضافة الأخصائية بنجاح');
  };

  const updateSpecialist = (id: string, specialist: Partial<Specialist>) => {
    setSpecialists(
      specialists.map((s) => (s.id === id ? { ...s, ...specialist } : s))
    );
    toast.success('تم تحديث الأخصائية بنجاح');
  };

  // Employees functions - Frontend Only
  const addEmployee = async (employee: Omit<Employee, 'id'>) => {
    try {
      // Frontend-only mode: save to state
      const newEmployee: Employee = {
        ...employee,
        id: Date.now().toString(),
      };

      setEmployees([...employees, newEmployee]);
      
      addNotification({
        title: 'موظف جديد',
        message: `تم إضافة موظف جديد "${employee.name}"`,
        time: 'الآن',
        read: false,
      });
      toast.success('تم إضافة المظف بنجاح');
    } catch (error: any) {
      console.error('Error adding employee:', error);
      toast.error(error.message || 'حدث خطأ أثناء إضافة الموظف');
      throw error;
    }
  };

  const updateEmployee = async (id: string, employee: Partial<Employee>) => {
    try {
      // Frontend-only mode: update in state
      setEmployees(
        employees.map((e) => (e.id === id ? { ...e, ...employee } : e))
      );
      
      addNotification({
        title: 'تحديث موظف',
        message: `تم تحديث بيانات الموظف`,
        time: 'الآن',
        read: false,
      });
      toast.success('تم تحديث الموظف بنجاح');
    } catch (error: any) {
      console.error('Error updating employee:', error);
      toast.error(error.message || 'حدث خطأ أثناء تحديث الموظف');
      throw error;
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      const employee = employees.find((e) => e.id === id);
      setEmployees(employees.filter((e) => e.id !== id));
      
      addNotification({
        title: 'حذف موظف',
        message: `تم حذف الموظف "${employee?.name}"`,
        time: 'الآن',
        read: false,
      });
      toast.success('تم حذف الموظف بنجاح');
    } catch (error: any) {
      console.error('Error deleting employee:', error);
      toast.error(error.message || 'حدث خطأ أثناء حذف الموظف');
      throw error;
    }
  };

  // Bonuses functions (Local only - no backend yet)
  const addBonus = (bonus: Omit<Bonus, 'id'>) => {
    const newBonus = {
      ...bonus,
      id: Date.now().toString(),
    };
    setBonuses([...bonuses, newBonus]);
    addNotification({
      title: 'مكافأة جديدة',
      message: `تم إضافة مكافأة بقيمة ${bonus.amount} ج.م لـ ${bonus.employeeName}`,
      time: 'الآن',
      read: false,
    });
    toast.success('تم إضافة المكافأة بنجاح');
  };

  const updateBonus = (id: string, bonus: Partial<Bonus>) => {
    setBonuses(
      bonuses.map((b) => (b.id === id ? { ...b, ...bonus } : b))
    );
    toast.success('تم تحديث المكافأة بنجاح');
  };

  const deleteBonus = (id: string) => {
    const bonus = bonuses.find((b) => b.id === id);
    setBonuses(bonuses.filter((b) => b.id !== id));
    addNotification({
      title: 'حذف مكافأة',
      message: `تم حذف مكافأة بقيمة ${bonus?.amount} ج.م لـ ${bonus?.employeeName}`,
      time: 'الآن',
      read: false,
    });
    toast.success('تم حذف المكافأة بنجاح');
  };

  // Expenses functions - Frontend Only
  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    try {
      // Frontend-only mode: save to state
      const newExpense: Expense = {
        ...expense,
        id: Date.now().toString(),
      };

      setExpenses([...expenses, newExpense]);
      
      addNotification({
        title: 'مصروف جديد',
        message: `تم إضافة مصروف بقيمة ${expense.amount} ج.م`,
        time: 'الآن',
        read: false,
      });
      toast.success('تم إضافة المصروف بنجاح');
    } catch (error: any) {
      console.error('Error adding expense:', error);
      toast.error(error.message || 'حدث خطأ أثناء إضافة المصروف');
      throw error;
    }
  };

  const updateExpense = async (id: string, expense: Partial<Expense>) => {
    try {
      // Frontend-only mode: update in state
      setExpenses(
        expenses.map((e) => (e.id === id ? { ...e, ...expense } : e))
      );
      toast.success('تم تحديث المصروف بنجاح');
    } catch (error: any) {
      console.error('Error updating expense:', error);
      toast.error(error.message || 'حدث خطأ أثناء تحديث المصروف');
      throw error;
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const expense = expenses.find((e) => e.id === id);
      setExpenses(expenses.filter((e) => e.id !== id));
      
      addNotification({
        title: 'حذف مصروف',
        message: `تم حذف مصروف بقيمة ${expense?.amount} ج.م`,
        time: 'الآن',
        read: false,
      });
      toast.success('تم حذف المصروف بنجاح');
    } catch (error: any) {
      console.error('Error deleting expense:', error);
      toast.error(error.message || 'حدث خطأ أثناء حذف المصروف');
      throw error;
    }
  };

  // Suppliers functions - Frontend Only
  const addSupplier = (supplier: Omit<Supplier, 'id'>) => {
    const newSupplier = {
      ...supplier,
      id: Date.now().toString(),
    };
    setSuppliers([...suppliers, newSupplier]);
    addNotification({
      title: 'مورد جديد',
      message: `تم إضافة مورد جديد "${supplier.name}"`,
      time: 'الآن',
      read: false,
    });
    toast.success('تم إضافة المورد بنجاح');
  };

  const updateSupplier = (id: string, supplier: Partial<Supplier>) => {
    setSuppliers(
      suppliers.map((s) => (s.id === id ? { ...s, ...supplier } : s))
    );
    toast.success('تم تحديث المورد بنجاح');
  };

  const deleteSupplier = (id: string) => {
    const supplier = suppliers.find((s) => s.id === id);
    setSuppliers(suppliers.filter((s) => s.id !== id));
    addNotification({
      title: 'حذف مورد',
      message: `تم حذف المورد "${supplier?.name}"`,
      time: 'الآن',
      read: false,
    });
    toast.success('تم حذف المورد بنجاح');
  };

  // Purchase Invoices functions - Frontend Only
  const addPurchaseInvoice = (invoice: Omit<PurchaseInvoice, 'id'>) => {
    const newInvoice = {
      ...invoice,
      id: Date.now().toString(),
    };
    setPurchaseInvoices([...purchaseInvoices, newInvoice]);
    
    // Add purchased items to inventory
    if (invoice.items && invoice.items.length > 0) {
      const updatedInventory = [...inventory];
      
      invoice.items.forEach((item: any) => {
        // Check if product already exists in inventory
        const existingProductIndex = updatedInventory.findIndex(
          (inv) => inv.name.toLowerCase() === item.name.toLowerCase()
        );
        
        if (existingProductIndex !== -1) {
          // Product exists, increase quantity
          updatedInventory[existingProductIndex] = {
            ...updatedInventory[existingProductIndex],
            stock: updatedInventory[existingProductIndex].stock + item.quantity,
            // Update price if different
            price: item.price,
          };
        } else {
          // Product doesn't exist, add new product
          const newProduct: InventoryItem = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: item.name,
            stock: item.quantity,
            price: item.price,
            category: 'مشتريات', // Default category for purchased items
            minStock: 10, // Default minimum quantity
          };
          updatedInventory.push(newProduct);
        }
      });

      setInventory(updatedInventory);
    }

    addNotification({
      title: 'فاتورة شراء جديدة',
      message: `تم إضافة فاتورة شراء جديدة من "${invoice.supplierName}" وإضافة المنتجات للمخزون`,
      time: 'الآن',
      read: false,
    });
    toast.success('تم إضافة فاتورة الشراء والمنتجات للمخزون بنجاح');
  };

  const updatePurchaseInvoice = (id: string, invoice: Partial<PurchaseInvoice>) => {
    setPurchaseInvoices(
      purchaseInvoices.map((i) => (i.id === id ? { ...i, ...invoice } : i))
    );
    toast.success('تم تحديث فاتورة الشراء بنجاح');
  };

  const deletePurchaseInvoice = (id: string) => {
    const invoice = purchaseInvoices.find((i) => i.id === id);
    setPurchaseInvoices(purchaseInvoices.filter((i) => i.id !== id));
    addNotification({
      title: 'حذف فاتورة شراء',
      message: `تم حذف فاتورة الشراء من "${invoice?.supplierName}"`,
      time: 'الآن',
      read: false,
    });
    toast.success('تم حذف فاتورة الشراء بنجاح');
  };

  // Shifts functions - User-specific shifts with localStorage
  const addShift = (shift: Omit<Shift, 'id' | 'userId'>) => {
    if (!currentUser) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }

    const newShift: Shift = {
      ...shift,
      id: Date.now().toString(),
      userId: currentUser.id, // Assign to current user
    };

    const updatedShifts = [...shifts, newShift];
    setShifts(updatedShifts);
    localStorage.setItem('shifts', JSON.stringify(updatedShifts));
    toast.success('تم فتح الوردية بنجاح');
  };

  const updateShift = (id: string, shift: Partial<Shift>) => {
    const updatedShifts = shifts.map((s) => (s.id === id ? { ...s, ...shift } : s));
    setShifts(updatedShifts);
    localStorage.setItem('shifts', JSON.stringify(updatedShifts));
    toast.success('تم تحديث الوردية بنجاح');
  };

  const closeShift = (id: string) => {
    const updatedShifts = shifts.map((s) =>
      s.id === id ? { ...s, status: 'closed' as const } : s
    );
    setShifts(updatedShifts);
    localStorage.setItem('shifts', JSON.stringify(updatedShifts));
    toast.success('تم إغلاق الوردية بنجاح');
  };

  // Notifications functions
  const markNotificationAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const newNotification = {
      ...notification,
      id: Date.now().toString(),
    };
    setNotifications([newNotification, ...notifications]);
  };

  // Users functions - state only (users loaded from API)
  const addUser = (user: Omit<User, 'id'>) => {
    const newUser: User = {
      ...user,
      id: Date.now().toString(),
    };
    setUsers((prev) => [...prev, newUser]);
    addNotification({
      title: 'مستخدم جديد',
      message: `تم إضافة مستخدم جديد "${user.name}"`,
      time: 'الآن',
      read: false,
    });
    toast.success('تم إضافة المستخدم بنجاح');
  };

  const updateUser = (id: string, user: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...user } : u))
    );
    toast.success('تم تحديث المستخدم بنجاح');
  };

  const deleteUser = (id: string) => {
    const user = users.find((u) => u.id === id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
    addNotification({
      title: 'حذف مستخدم',
      message: `تم حذف المستخدم \"${user?.name}\" من النظام`,
      time: 'الآن',
      read: false,
    });
    toast.success('تم حذف المستخدم بنجاح');
  };

  const updateCurrentUser = (user: Partial<User>) => {
    if (currentUser) {
      const updated = { ...currentUser, ...user };
      setCurrentUser(updated);
      setUsers((prev) =>
        prev.map((u) => (u.id === currentUser.id ? updated : u))
      );
    }
  };

  const loginUser = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      toast.success(`مرحباً ${user.name}`);
    }
  };

  const loginWithCredentials = async (
    credentials: { username: string; password: string }
  ): Promise<boolean> => {
    try {
      const response = await authService.login(credentials);
      const userData = response?.data?.user ?? (response as { user?: unknown })?.user;
      if (userData && typeof userData === 'object') {
        const user = mapAuthUserToContextUser(
          userData as Record<string, unknown>
        );
        setCurrentUser(user);
        toast.success(`مرحباً ${user.name}`);
        loadAllData().catch((err) => {
          console.warn('Background data load after login failed:', err);
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logoutUser = () => {
    if (!currentUser) {
      return;
    }

    // Check if current user has an open shift
    const hasOpenShift = shifts.some(
      (shift) => shift.userId === currentUser.id && shift.status === 'open'
    );

    if (hasOpenShift) {
      toast.error('يجب إغلاق الوردية المفتوحة قبل تسجيل الخروج');
      return;
    }

    setCurrentUser(null);
    authService.logout();
    toast.success('تم تسجيل الخروج بنجاح');
  };

  // System Settings - integrated with API
  const updateSystemSettings = async (settings: Partial<SystemSettings>) => {
    try {
      const payload = {
        businessName: settings.shopName,
        businessAddress: settings.address,
        businessPhone: settings.phone,
        businessEmail: settings.email,
        currency: settings.currency,
        language: settings.language,
        workingHours: settings.workingHours,
      };
      await settingService.updateSettings(payload);
      setSystemSettings((prev) => ({ ...prev, ...settings }));
      toast.success('تم تحديث الإعدادات بنجاح');
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'حدث خطأ أثناء تحديث الإعدادات');
      throw error;
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const value: AppContextType = {
    loading,
    services,
    addService,
    updateService,
    deleteService,
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    getOrCreateCustomer,
    appointments,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    sales,
    addSale,
    inventory,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    decreaseInventoryStock,
    attendanceRecords,
    addAttendanceRecord,
    updateAttendanceRecord,
    deleteAttendanceRecord,
    specialists,
    addSpecialist,
    updateSpecialist,
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    bonuses,
    addBonus,
    updateBonus,
    deleteBonus,
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    suppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    purchaseInvoices,
    addPurchaseInvoice,
    updatePurchaseInvoice,
    deletePurchaseInvoice,
    shifts,
    addShift,
    updateShift,
    closeShift,
    notifications,
    markNotificationAsRead,
    addNotification,
    currentUser,
    users,
    addUser,
    updateUser,
    deleteUser,
    updateCurrentUser,
    loginUser,
    loginWithCredentials,
    logoutUser,
    systemSettings,
    updateSystemSettings,
    darkMode,
    toggleDarkMode,
    searchQuery,
    setSearchQuery,
    refreshData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export { AppContext };