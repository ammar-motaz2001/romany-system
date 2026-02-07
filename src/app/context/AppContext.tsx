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
import { shiftService } from '@/services/shift.service';

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

/** Extract error message from API error. Handles { success, error } or stringified JSON. */
function getApiErrorMessage(error: unknown): string {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (data == null) return '';
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data) as { error?: string; message?: string };
      return String(parsed?.error ?? parsed?.message ?? '');
    } catch {
      return data;
    }
  }
  const obj = data as Record<string, unknown>;
  return String(obj?.error ?? obj?.message ?? '');
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
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<void>;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  
  // Purchase Invoices
  purchaseInvoices: PurchaseInvoice[];
  addPurchaseInvoice: (invoice: Omit<PurchaseInvoice, 'id'>) => Promise<void>;
  updatePurchaseInvoice: (id: string, invoice: Partial<PurchaseInvoice>) => Promise<void>;
  deletePurchaseInvoice: (id: string) => Promise<void>;
  
  // Shifts
  shifts: Shift[];
  fetchShifts: () => Promise<void>;
  addShift: (shift: Omit<Shift, 'id' | 'userId'>) => Promise<void>;
  updateShift: (id: string, shift: Partial<Shift>) => Promise<void>;
  closeShift: (id: string) => Promise<void>;
  
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
        suppliersRes,
        purchaseInvoicesRes,
        shiftsRes,
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
        supplierService.getAllSuppliers(),
        purchaseInvoiceService.getAllInvoices(),
        shiftService.getAllShifts(),
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
          ? mapBackendInventoryToContext(unwrapList(inventoryRes.value))
          : []
      );
      setAttendanceRecords(
        attendanceRes.status === 'fulfilled'
          ? mapBackendAttendanceToContext(unwrapList(attendanceRes.value))
          : []
      );
      setEmployees(
        employeesRes.status === 'fulfilled'
          ? mapBackendEmployeesToContext(unwrapList(employeesRes.value))
          : []
      );
      setExpenses(
        expensesRes.status === 'fulfilled'
          ? mapBackendExpensesToContext(unwrapList(expensesRes.value))
          : []
      );
      setSuppliers(
        suppliersRes.status === 'fulfilled'
          ? mapBackendSuppliersToContext(unwrapList(suppliersRes.value))
          : []
      );
      setPurchaseInvoices(
        purchaseInvoicesRes.status === 'fulfilled'
          ? mapBackendPurchaseInvoicesToContext(unwrapList(purchaseInvoicesRes.value))
          : []
      );
      setShifts(
        shiftsRes.status === 'fulfilled'
          ? mapBackendShiftsToContext(unwrapList(shiftsRes.value))
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
      setSuppliers([]);
      setPurchaseInvoices([]);
      setShifts([]);
      toast.error('فشل تحميل البيانات من الخادم');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch shifts from GET /api/shifts (used by الورديات page and loadAllData)
  const fetchShifts = useCallback(async () => {
    if (!authService.isAuthenticated()) return;
    try {
      const res = await shiftService.getAllShifts();
      const list = unwrapList(res);
      setShifts(mapBackendShiftsToContext(list));
    } catch (error) {
      console.error('Error fetching shifts:', error);
    }
  }, []);

  // Load data only when authenticated (shifts come from API in loadAllData); fallback to localStorage when not authenticated
  useEffect(() => {
    if (authService.isAuthenticated()) {
      loadAllData();
    } else {
      loadShiftsFromLocalStorage();
      setLoading(false);
    }
  }, [loadAllData]);

  /** Map backend customer shape (totalVisits, totalSpent) to context shape (visits, spending) */
  function mapBackendCustomersToContext(list: unknown[]): Customer[] {
    return list.map((c) => {
      const r = c as Record<string, unknown>;
      return {
        id: String(r.id ?? r._id ?? ''),
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
    return list.map((a) => mapBackendAppointmentToContext(a));
  }

  /** Map a single backend appointment (for create/update response). Store status in Arabic for UI. */
  function mapBackendAppointmentToContext(raw: unknown, fallback?: Partial<Appointment>): Appointment {
    const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const dateRaw = r.date ?? r.appointmentDate ?? r.scheduledAt ?? r.createdAt ?? fallback?.date;
    const dateStr =
      typeof dateRaw === 'string'
        ? dateRaw.includes('T')
          ? dateRaw.split('T')[0]
          : dateRaw
        : '';
    const apiStatus = String(r.status ?? fallback?.status ?? '');
    return {
      id: String(r.id ?? r._id ?? fallback?.id ?? ''),
      customer: String(r.customer ?? r.customerName ?? fallback?.customer ?? ''),
      customerPhone: (r.customerPhone ?? fallback?.customerPhone) as string | undefined,
      customerImage: (r.customerImage ?? fallback?.customerImage) as string | undefined,
      service: String(r.service ?? r.serviceName ?? fallback?.service ?? ''),
      time: String(r.time ?? r.startTime ?? fallback?.time ?? ''),
      duration: String(r.duration ?? fallback?.duration ?? ''),
      status: mapStatus(apiStatus) || apiStatus,
      date: dateStr || fallback?.date,
      specialist: (r.specialist ?? fallback?.specialist) as string | undefined,
    };
  }

  /** Normalize backend inventory shape (stock/quantity, minStock/minQuantity, id/_id) */
  function mapBackendInventoryToContext(list: unknown[]): InventoryItem[] {
    return list.map((a) => {
      const r = a as Record<string, unknown>;
      return {
        id: String(r.id ?? r._id ?? ''),
        name: String(r.name ?? ''),
        category: String(r.category ?? ''),
        stock: Number(r.stock ?? r.quantity ?? 0),
        price: Number(r.price ?? 0),
        minStock: r.minStock != null ? Number(r.minStock) : r.minQuantity != null ? Number(r.minQuantity) : undefined,
        image: r.image as string | undefined,
      };
    });
  }

  /** Normalize backend supplier shape (id/_id) */
  function mapBackendSuppliersToContext(list: unknown[]): Supplier[] {
    return list.map((a) => {
      const r = a as Record<string, unknown>;
      return {
        id: String(r.id ?? r._id ?? ''),
        name: String(r.name ?? ''),
        phone: String(r.phone ?? ''),
        address: (r.address as string) ?? '',
        balance: Number(r.balance ?? 0),
        status: (r.status as 'نشط' | 'موقوف') ?? 'نشط',
        notes: (r.notes as string) ?? undefined,
      };
    });
  }

  /** Normalize backend purchase invoice shape (id/_id, supplierId/supplier, items) */
  function mapBackendPurchaseInvoicesToContext(list: unknown[]): PurchaseInvoice[] {
    return list.map((a) => {
      const r = a as Record<string, unknown>;
      const itemsRaw = (r.items as Array<Record<string, unknown>>) ?? [];
      const items = itemsRaw.map((it) => ({
        name: String(it.itemName ?? it.name ?? ''),
        quantity: Number(it.quantity ?? 0),
        price: Number(it.unitPrice ?? it.price ?? 0),
      }));
      const statusRaw = String(r.status ?? '');
      const status: PurchaseInvoice['status'] =
        statusRaw === 'مدفوعة' ? 'مدفوعة'
        : statusRaw === 'جزئية' || statusRaw === 'جزئي' ? 'جزئي'
        : 'غير مدفوعة';
      return {
        id: String(r.id ?? r._id ?? ''),
        supplierId: String(r.supplierId ?? r.supplier ?? ''),
        supplierName: String(r.supplierName ?? ''),
        date: String(r.date ?? ''),
        items,
        totalAmount: Number(r.totalAmount ?? 0),
        paidAmount: Number(r.paidAmount ?? 0),
        paymentMethod: (r.paymentMethod as PurchaseInvoice['paymentMethod']) ?? undefined,
        status,
        notes: (r.notes as string) ?? undefined,
      };
    });
  }

  /** Normalize backend shift shape (id/_id, date, startTime, endTime, userId, status) */
  function mapBackendShiftsToContext(list: unknown[]): Shift[] {
    return list.map((a) => {
      const r = a as Record<string, unknown>;
      const dateRaw = r.date ?? r.startTime ?? r.createdAt;
      const dateStr =
        typeof dateRaw === 'string'
          ? dateRaw.includes('T')
            ? dateRaw.split('T')[0]
            : dateRaw
          : '';
      const userObj = r.user && typeof r.user === 'object' ? (r.user as Record<string, unknown>) : null;
      const cashierFromUser = userObj
        ? String(
            (userObj.firstName && userObj.lastName
              ? `${userObj.firstName} ${userObj.lastName}`.trim()
              : userObj.name ?? userObj.username ?? '') ?? ''
          ).trim()
        : '';
      const cashierRaw = String(r.cashier ?? cashierFromUser ?? '').trim();
      const cashier =
        !cashierRaw || /undefined/i.test(cashierRaw) ? 'كاشير' : cashierRaw;

      const salesDetailsRaw = r.salesDetails ?? r.sales_details;
      const sd =
        salesDetailsRaw && typeof salesDetailsRaw === 'object'
          ? (salesDetailsRaw as Record<string, unknown>)
          : null;
      const salesDetails = sd
        ? {
            cash: Number(sd.cash ?? sd.Cash ?? 0),
            card: Number(sd.card ?? sd.Card ?? 0),
            instapay: Number(sd.instapay ?? sd.InstaPay ?? sd.instaPay ?? 0),
          }
        : undefined;

      const userId =
        r.userId ??
        (userObj ? (userObj.id ?? userObj._id) : null) ??
        r.user;
      return {
        id: String(r.id ?? r._id ?? ''),
        userId: String(userId ?? ''),
        startTime: String(r.startTime ?? r.start ?? ''),
        endTime: String(r.endTime ?? r.end ?? ''),
        startingCash: Number(
          r.startingCash ?? r.openingBalance ?? r.openingCash ?? 0
        ),
        totalSales: Number(r.totalSales ?? r.total_sales ?? 0),
        totalExpenses: Number(r.totalExpenses ?? r.total_expenses ?? 0),
        finalCash: Number(r.finalCash ?? r.closingCash ?? r.closing_cash ?? 0),
        status: (r.status === 'closed' ? 'closed' : 'open') as 'open' | 'closed',
        date:
          dateStr ||
          (typeof r.startTime === 'string' ? r.startTime.split('T')[0] : ''),
        cashier,
        salesDetails: salesDetails
          ? {
              cash: salesDetails.cash,
              card: salesDetails.card,
              instapay: salesDetails.instapay,
            }
          : { cash: 0, card: 0, instapay: 0 },
      };
    });
  }

  /** Normalize backend expense shape (id/_id, date, amount, paymentMethod, etc.) */
  function mapBackendExpensesToContext(list: unknown[]): Expense[] {
    return list.map((a) => mapBackendExpenseToContext(a));
  }

  function mapBackendExpenseToContext(raw: unknown, fallback?: Partial<Expense>): Expense {
    const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const dateRaw = r.date ?? r.expenseDate ?? r.createdAt ?? fallback?.date;
    const dateStr =
      typeof dateRaw === 'string'
        ? dateRaw.includes('T')
          ? dateRaw.split('T')[0]
          : dateRaw
        : '';
    return {
      id: String(r.id ?? r._id ?? fallback?.id ?? ''),
      date: dateStr || (fallback?.date ?? ''),
      description: String(r.description ?? fallback?.description ?? ''),
      amount: Number(r.amount ?? fallback?.amount ?? 0),
      paymentMethod: String(r.paymentMethod ?? r.payment_method ?? fallback?.paymentMethod ?? ''),
      notes: (r.notes ?? fallback?.notes) as string | undefined,
      category: (r.category ?? fallback?.category) as string | undefined,
    };
  }

  /** Normalize backend employee shape (id/_id, hireDate/startDate, baseSalary/salary, status) */
  function mapBackendEmployeesToContext(list: unknown[]): Employee[] {
    return list.map((a) => {
      const r = a as Record<string, unknown>;
      const statusRaw = String(r.status ?? '');
      const statusMap: Record<string, 'نشط' | 'موقوف'> = {
        active: 'نشط',
        terminated: 'موقوف',
        نشط: 'نشط',
        موقوف: 'موقوف',
      };
      const status = statusMap[statusRaw.toLowerCase()] ?? 'نشط';
      const hireDateRaw = r.hireDate ?? r.startDate ?? r.start_date ?? '';
      const hireDate =
        typeof hireDateRaw === 'string' && hireDateRaw.includes('T')
          ? hireDateRaw.split('T')[0]
          : String(hireDateRaw ?? '');
      return {
        id: String(r.id ?? r._id ?? ''),
        name: String(r.name ?? ''),
        phone: String(r.phone ?? ''),
        position: String(r.position ?? ''),
        hireDate: hireDate || new Date().toISOString().split('T')[0],
        salaryType: (r.salaryType as 'شهري' | 'يومي' | 'بالساعة') ?? 'شهري',
        baseSalary: Number(r.baseSalary ?? r.salary ?? 0),
        workDays: Number(r.workDays ?? 22),
        shiftHours: Number(r.shiftHours ?? 8),
        hourlyRate: r.hourlyRate != null ? Number(r.hourlyRate) : undefined,
        commission: Number(r.commission ?? 0),
        status,
        latePenaltyPerMinute: r.latePenaltyPerMinute != null ? Number(r.latePenaltyPerMinute) : undefined,
        absencePenaltyPerDay: r.absencePenaltyPerDay != null ? Number(r.absencePenaltyPerDay) : undefined,
        customDeductions: r.customDeductions != null ? Number(r.customDeductions) : undefined,
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
        id: String(r.id ?? r._id ?? ''),
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

  /** Map appointment status to backend enum (API: pending | confirmed | completed | cancelled | no-show; Arabic: معلق, مؤكد, منتهي, ملغي) */
  const mapAppointmentStatusToApi = (status: string): string => {
    const s = (status ?? '').trim();
    const arabicToApi: Record<string, string> = {
      'معلق': 'pending',
      'مؤكد': 'confirmed',
      'مكتمل': 'completed',
      'منتهي': 'completed',
      'ملغي': 'cancelled',
      'لم يحضر': 'no-show',
    };
    if (arabicToApi[s]) return arabicToApi[s];
    const lower = s.toLowerCase();
    if (['pending', 'confirmed', 'completed', 'cancelled', 'no-show'].includes(lower)) return lower;
    return 'pending';
  };

  /** Map sale status to backend enum (API: completed | pending | cancelled; Arabic: مكتمل, قيد الانتظار, ملغي) */
  const mapSaleStatusToApi = (status: string): string => {
    const s = (status ?? '').trim();
    const arabicToApi: Record<string, string> = {
      'مكتمل': 'completed',
      'منتهي': 'completed',
      'غير مكتمل': 'pending',
      'قيد الانتظار': 'pending',
      'معلق': 'pending',
      'ملغي': 'cancelled',
    };
    if (arabicToApi[s]) return arabicToApi[s];
    const lower = s.toLowerCase();
    if (lower === 'completed' || lower === 'pending' || lower === 'cancelled') return lower;
    return 'completed';
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
      const raw = unwrapData<{ id?: string; _id?: string; name: string; phone: string; email?: string; totalVisits?: number; totalSpent?: number }>(res) ?? res as Record<string, unknown>;
      const newCustomer: Customer = {
        id: String(raw?.id ?? (raw as Record<string, unknown>)?._id ?? Date.now()),
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
      const msg = getApiErrorMessage(error);
      const isAlreadyRegistered = /مسجل|already|exists|موجود|مُسَجّل|رقم الهاتف/i.test(msg);
      if (!isAlreadyRegistered) {
        toast.error(msg || 'حدث خطأ أثناء إضافة العميل');
      }
      throw error;
    }
  };

  const updateCustomer = async (id: string, customer: Partial<Customer>) => {
    const normalizedId = id != null ? String(id).trim() : '';
    if (!normalizedId) {
      toast.error('معرف العميل غير صالح');
      return;
    }
    try {
      await customerService.update(normalizedId, {
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        totalVisits: customer.visits,
        totalSpent: customer.spending,
      });
      setCustomers((prev) =>
        prev.map((c) => (c.id === normalizedId ? { ...c, ...customer } : c))
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

  // Appointments functions - integrated with API
  const addAppointment = async (appointment: Omit<Appointment, 'id'>) => {
    let existingCustomer = customers.find((c) => c.phone === appointment.customerPhone);

    if (
      !existingCustomer &&
      appointment.customer &&
      appointment.customerPhone &&
      appointment.customer !== 'عميل نقدي'
    ) {
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

    const dateStr =
      typeof appointment.date === 'string' && appointment.date.includes('T')
        ? appointment.date.split('T')[0]
        : (appointment.date ?? '');

    try {
      const created = await appointmentService.createAppointment({
        customer: appointment.customer,
        customerPhone: appointment.customerPhone,
        service: appointment.service,
        time: appointment.time,
        duration: appointment.duration,
        status: mapAppointmentStatusToApi(appointment.status),
        date: dateStr,
        specialist: appointment.specialist,
      });
      const raw = unwrapData<Record<string, unknown>>(created) ?? (created as Record<string, unknown>);
      const newAppointment = mapBackendAppointmentToContext(raw, appointment);
      setAppointments((prev) => [...prev, newAppointment]);
      addNotification({
        title: 'موعد جديد',
        message: `تم حجز موعد جديد لـ "${appointment.customer}"`,
        time: 'الآن',
        read: false,
      });
      toast.success('تم إضافة الموعد بنجاح');
    } catch (error: unknown) {
      const msg = getApiErrorMessage(error);
      toast.error(msg ?? 'حدث خطأ أثناء إضافة الموعد');
      throw error;
    }
  };

  const updateAppointment = async (id: string, appointment: Partial<Appointment>) => {
    const normalizedId = id != null ? String(id).trim() : '';
    if (!normalizedId) {
      toast.error('معرف الموعد غير صالح');
      return;
    }
    try {
      const payload: Record<string, unknown> = {};
      if (appointment.customer != null) payload.customer = appointment.customer;
      if (appointment.customerPhone != null) payload.customerPhone = appointment.customerPhone;
      if (appointment.service != null) payload.service = appointment.service;
      if (appointment.time != null) payload.time = appointment.time;
      if (appointment.duration != null) payload.duration = appointment.duration;
      if (appointment.status != null) payload.status = mapAppointmentStatusToApi(appointment.status);
      if (appointment.date != null) {
        payload.date =
          typeof appointment.date === 'string' && appointment.date.includes('T')
            ? appointment.date.split('T')[0]
            : appointment.date;
      }
      if (appointment.specialist != null) payload.specialist = appointment.specialist;

      await appointmentService.updateAppointment(normalizedId, payload);
      setAppointments((prev) =>
        prev.map((a) => (a.id === normalizedId ? { ...a, ...appointment } : a))
      );
      toast.success('تم تحديث الموعد بنجاح');
    } catch (error: unknown) {
      const msg = getApiErrorMessage(error);
      toast.error(msg ?? 'حدث خطأ أثناء تحديث الموعد');
      throw error;
    }
  };

  const deleteAppointment = async (id: string) => {
    const normalizedId = id != null ? String(id).trim() : '';
    if (!normalizedId) {
      toast.error('معرف الموعد غير صالح');
      return;
    }
    try {
      await appointmentService.deleteAppointment(normalizedId);
      setAppointments((prev) => prev.filter((a) => a.id !== normalizedId));
      addNotification({
        title: 'تم حذف الموعد',
        message: 'تم حذف الموعد بنجاح',
        time: 'الآن',
        read: false,
      });
      toast.success('تم حذف الموعد بنجاح');
    } catch (error: unknown) {
      const msg = getApiErrorMessage(error);
      toast.error(msg ?? 'حدث خطأ أثناء حذف الموعد');
      throw error;
    }
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
        const msg = getApiErrorMessage(error);
        const isAlreadyRegistered = /مسجل|already|exists|موجود|مُسَجّل|رقم الهاتف/i.test(msg);
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
        status: mapSaleStatusToApi(sale.status),
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
      const msg = getApiErrorMessage(error);
      if (msg !== 'المورد غير موجود') {
        toast.error(msg || 'حدث خطأ أثناء إضافة عملية البيع');
      }
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
      const raw = unwrapData<Record<string, unknown>>(created) ?? (created as Record<string, unknown>);
      const mapped = mapBackendInventoryToContext([raw])[0];
      if (mapped && mapped.id) {
        setInventory((prev) => [...prev, mapped]);
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

  // Attendance functions - add via API (createManualAttendance), update/delete local (no API)
  const addAttendanceRecord = async (record: Omit<AttendanceRecord, 'id'>) => {
    const dateStr =
      typeof record.date === 'string' && record.date.includes('T')
        ? record.date.split('T')[0]
        : (record.date ?? '');
    try {
      const created = await attendanceService.createManualAttendance({
        employeeId: record.employeeId,
        employeeName: record.employeeName ?? record.name,
        position: record.position,
        checkIn: record.checkIn,
        checkOut: record.checkOut ?? '',
        date: dateStr,
        advance: record.advance,
        notes: record.notes,
      });
      const raw = unwrapData<Record<string, unknown>>(created) ?? (created as Record<string, unknown>);
      const newRecord = mapBackendAttendanceToContext([raw])[0];
      if (newRecord && newRecord.id) {
        setAttendanceRecords((prev) => [...prev, newRecord]);
      }
      addNotification({
        title: 'تسجيل حضور',
        message: `تم تسجيل حضور "${record.name}"`,
        time: 'الآن',
        read: false,
      });
      toast.success('تم تسجيل الحضور بنجاح');
    } catch (error: unknown) {
      const msg = getApiErrorMessage(error);
      toast.error(msg ?? 'حدث خطأ أثناء تسجيل الحضور');
      throw error;
    }
  };

  const updateAttendanceRecord = async (id: string, record: Partial<AttendanceRecord>) => {
    setAttendanceRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...record } : r))
    );
    toast.success('تم تحديث سجل الحضور بنجاح');
  };

  const deleteAttendanceRecord = (id: string) => {
    const record = attendanceRecords.find((r) => r.id === id);
    setAttendanceRecords((prev) => prev.filter((r) => r.id !== id));
    addNotification({
      title: 'حذف سجل حضور',
      message: `تم حذف سجل حضور "${record?.name}"`,
      time: 'الآن',
      read: false,
    });
    toast.success('تم حذف سجل الحضور بنجاح');
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

  // Employees functions - integrated with API
  const addEmployee = async (employee: Omit<Employee, 'id'>) => {
    try {
      const created = await employeeService.createEmployee({
        name: employee.name,
        position: employee.position,
        phone: employee.phone,
        salary: employee.baseSalary,
        commission: employee.commission,
        startDate: employee.hireDate,
      });
      const raw = unwrapData<Record<string, unknown>>(created) ?? (created as Record<string, unknown>);
      const mapped = mapBackendEmployeesToContext([raw])[0];
      if (mapped && mapped.id) {
        setEmployees((prev) => [...prev, mapped]);
      }
      addNotification({
        title: 'موظف جديد',
        message: `تم إضافة موظف جديد "${employee.name}"`,
        time: 'الآن',
        read: false,
      });
      toast.success('تم إضافة الموظف بنجاح');
    } catch (error: unknown) {
      const msg = getApiErrorMessage(error);
      toast.error(msg ?? 'حدث خطأ أثناء إضافة الموظف');
      throw error;
    }
  };

  const updateEmployee = async (id: string, employee: Partial<Employee>) => {
    const normalizedId = id != null ? String(id).trim() : '';
    if (!normalizedId) {
      toast.error('معرف الموظف غير صالح');
      return;
    }
    try {
      const payload: Record<string, unknown> = {};
      if (employee.name != null) payload.name = employee.name;
      if (employee.position != null) payload.position = employee.position;
      if (employee.phone != null) payload.phone = employee.phone;
      if (employee.baseSalary != null) payload.salary = employee.baseSalary;
      if (employee.commission != null) payload.commission = employee.commission;
      if (employee.hireDate != null) payload.startDate = employee.hireDate;

      await employeeService.updateEmployee(normalizedId, payload);
      setEmployees((prev) =>
        prev.map((e) => (e.id === normalizedId ? { ...e, ...employee } : e))
      );
      addNotification({
        title: 'تحديث موظف',
        message: 'تم تحديث بيانات الموظف',
        time: 'الآن',
        read: false,
      });
      toast.success('تم تحديث الموظف بنجاح');
    } catch (error: unknown) {
      const msg = getApiErrorMessage(error);
      toast.error(msg ?? 'حدث خطأ أثناء تحديث الموظف');
      throw error;
    }
  };

  const deleteEmployee = async (id: string) => {
    const normalizedId = id != null ? String(id).trim() : '';
    if (!normalizedId) {
      toast.error('معرف الموظف غير صالح');
      return;
    }
    try {
      const employee = employees.find((e) => e.id === normalizedId);
      await employeeService.deleteEmployee(normalizedId);
      setEmployees((prev) => prev.filter((e) => e.id !== normalizedId));
      addNotification({
        title: 'حذف موظف',
        message: `تم حذف الموظف "${employee?.name}"`,
        time: 'الآن',
        read: false,
      });
      toast.success('تم حذف الموظف بنجاح');
    } catch (error: unknown) {
      const msg = getApiErrorMessage(error);
      toast.error(msg ?? 'حدث خطأ أثناء حذف الموظف');
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

  // Expenses functions - integrated with API
  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    const dateStr =
      typeof expense.date === 'string' && expense.date.includes('T')
        ? expense.date.split('T')[0]
        : (expense.date ?? '');
    try {
      const created = await expenseService.createExpense({
        description: expense.description,
        category: expense.category ?? '',
        amount: expense.amount,
        date: dateStr,
        paymentMethod: expense.paymentMethod,
        notes: expense.notes,
      });
      const raw = unwrapData<Record<string, unknown>>(created) ?? (created as Record<string, unknown>);
      const newExpense = mapBackendExpenseToContext(raw, expense);
      setExpenses((prev) => [...prev, newExpense]);
      addNotification({
        title: 'مصروف جديد',
        message: `تم إضافة مصروف بقيمة ${expense.amount} ج.م`,
        time: 'الآن',
        read: false,
      });
      toast.success('تم إضافة المصروف بنجاح');
    } catch (error: unknown) {
      const msg = getApiErrorMessage(error);
      toast.error(msg ?? 'حدث خطأ أثناء إضافة المصروف');
      throw error;
    }
  };

  const updateExpense = async (id: string, expense: Partial<Expense>) => {
    const normalizedId = id != null ? String(id).trim() : '';
    if (!normalizedId) {
      toast.error('معرف المصروف غير صالح');
      return;
    }
    try {
      const payload: Record<string, unknown> = {};
      if (expense.description != null) payload.description = expense.description;
      if (expense.category != null) payload.category = expense.category;
      if (expense.amount != null) payload.amount = expense.amount;
      if (expense.date != null) {
        payload.date =
          typeof expense.date === 'string' && expense.date.includes('T')
            ? expense.date.split('T')[0]
            : expense.date;
      }
      if (expense.paymentMethod != null) payload.paymentMethod = expense.paymentMethod;
      if (expense.notes != null) payload.notes = expense.notes;

      await expenseService.updateExpense(normalizedId, payload);
      setExpenses((prev) =>
        prev.map((e) => (e.id === normalizedId ? { ...e, ...expense } : e))
      );
      toast.success('تم تحديث المصروف بنجاح');
    } catch (error: unknown) {
      const msg = getApiErrorMessage(error);
      toast.error(msg ?? 'حدث خطأ أثناء تحديث المصروف');
      throw error;
    }
  };

  const deleteExpense = async (id: string) => {
    const normalizedId = id != null ? String(id).trim() : '';
    if (!normalizedId) {
      toast.error('معرف المصروف غير صالح');
      return;
    }
    try {
      const expense = expenses.find((e) => e.id === normalizedId);
      await expenseService.deleteExpense(normalizedId);
      setExpenses((prev) => prev.filter((e) => e.id !== normalizedId));
      addNotification({
        title: 'حذف مصروف',
        message: `تم حذف مصروف بقيمة ${expense?.amount ?? 0} ج.م`,
        time: 'الآن',
        read: false,
      });
      toast.success('تم حذف المصروف بنجاح');
    } catch (error: unknown) {
      const msg = getApiErrorMessage(error);
      toast.error(msg ?? 'حدث خطأ أثناء حذف المصروف');
      throw error;
    }
  };

  // Suppliers functions - integrated with API
  const addSupplier = async (supplier: Omit<Supplier, 'id'>) => {
    try {
      const created = await supplierService.createSupplier({
        name: supplier.name,
        phone: supplier.phone,
        address: supplier.address,
        status: supplier.status,
        notes: supplier.notes,
      });
      const raw = unwrapData<Record<string, unknown>>(created) ?? (created as Record<string, unknown>);
      const mapped = mapBackendSuppliersToContext([raw])[0];
      if (mapped && mapped.id) {
        setSuppliers((prev) => [...prev, mapped]);
      }
      addNotification({
        title: 'مورد جديد',
        message: `تم إضافة مورد جديد "${supplier.name}"`,
        time: 'الآن',
        read: false,
      });
      toast.success('تم إضافة المورد بنجاح');
    } catch (error: unknown) {
      const msg = getApiErrorMessage(error);
      toast.error(msg ?? 'حدث خطأ أثناء إضافة المورد');
      throw error;
    }
  };

  const updateSupplier = async (id: string, supplier: Partial<Supplier>) => {
    const normalizedId = id != null ? String(id).trim() : '';
    if (!normalizedId) {
      toast.error('معرف المورد غير صالح');
      return;
    }
    try {
      const payload: Record<string, unknown> = {};
      if (supplier.name != null) payload.name = supplier.name;
      if (supplier.phone != null) payload.phone = supplier.phone;
      if (supplier.address != null) payload.address = supplier.address;
      if (supplier.status != null) payload.status = supplier.status;
      if (supplier.notes != null) payload.notes = supplier.notes;

      await supplierService.updateSupplier(normalizedId, payload);
      setSuppliers((prev) =>
        prev.map((s) => (s.id === normalizedId ? { ...s, ...supplier } : s))
      );
      toast.success('تم تحديث المورد بنجاح');
    } catch (error: unknown) {
      const msg = getApiErrorMessage(error);
      toast.error(msg ?? 'حدث خطأ أثناء تحديث المورد');
      throw error;
    }
  };

  const deleteSupplier = async (id: string) => {
    const normalizedId = id != null ? String(id).trim() : '';
    if (!normalizedId) {
      toast.error('معرف المورد غير صالح');
      return;
    }
    try {
      const supplier = suppliers.find((s) => s.id === normalizedId);
      await supplierService.deleteSupplier(normalizedId);
      setSuppliers((prev) => prev.filter((s) => s.id !== normalizedId));
      addNotification({
        title: 'حذف مورد',
        message: `تم حذف المورد "${supplier?.name}"`,
        time: 'الآن',
        read: false,
      });
      toast.success('تم حذف المورد بنجاح');
    } catch (error: unknown) {
      const msg = getApiErrorMessage(error);
      toast.error(msg ?? 'حدث خطأ أثناء حذف المورد');
      throw error;
    }
  };

  // Purchase Invoices functions - integrated with API
  const addPurchaseInvoice = async (invoice: Omit<PurchaseInvoice, 'id'>) => {
    try {
      const created = await purchaseInvoiceService.createInvoice({
        supplier: invoice.supplierId,
        date: invoice.date,
        items: invoice.items.map((i) => ({
          itemName: i.name,
          quantity: i.quantity,
          unitPrice: i.price,
        })),
        paidAmount: invoice.paidAmount,
        paymentMethod: invoice.paymentMethod,
        notes: invoice.notes,
      });
      const raw = unwrapData<Record<string, unknown>>(created) ?? (created as Record<string, unknown>);
      const mapped = mapBackendPurchaseInvoicesToContext([raw])[0];
      if (mapped && mapped.id) {
        setPurchaseInvoices((prev) => [...prev, mapped]);
      }
      if (invoice.items && invoice.items.length > 0) {
        setInventory((prev) => {
          const updated = [...prev];
          invoice.items.forEach((item: { name: string; quantity: number; price: number }) => {
            const idx = updated.findIndex(
              (inv) => inv.name.toLowerCase() === item.name.toLowerCase()
            );
            if (idx !== -1) {
              updated[idx] = {
                ...updated[idx],
                stock: updated[idx].stock + item.quantity,
                price: item.price,
              };
            } else {
              updated.push({
                id: String(Date.now() + Math.random().toString(36).slice(2, 9)),
                name: item.name,
                stock: item.quantity,
                price: item.price,
                category: 'مشتريات',
                minStock: 10,
              });
            }
          });
          return updated;
        });
      }
      addNotification({
        title: 'فاتورة شراء جديدة',
        message: `تم إضافة فاتورة شراء جديدة من "${invoice.supplierName}"`,
        time: 'الآن',
        read: false,
      });
      toast.success('تم إضافة فاتورة الشراء بنجاح');
    } catch (error: unknown) {
      const msg = getApiErrorMessage(error);
      toast.error(msg ?? 'حدث خطأ أثناء إضافة فاتورة الشراء');
      throw error;
    }
  };

  const updatePurchaseInvoice = async (id: string, invoice: Partial<PurchaseInvoice>) => {
    const normalizedId = id != null ? String(id).trim() : '';
    if (!normalizedId) {
      toast.error('معرف الفاتورة غير صالح');
      return;
    }
    try {
      const payload: Record<string, unknown> = {};
      if (invoice.supplierId != null) payload.supplier = invoice.supplierId;
      if (invoice.date != null) payload.date = invoice.date;
      if (invoice.items != null) {
        payload.items = invoice.items.map((i) => ({
          itemName: i.name,
          quantity: i.quantity,
          unitPrice: i.price,
        }));
      }
      if (invoice.paidAmount != null) payload.paidAmount = invoice.paidAmount;
      if (invoice.paymentMethod != null) payload.paymentMethod = invoice.paymentMethod;
      if (invoice.notes != null) payload.notes = invoice.notes;

      await purchaseInvoiceService.updateInvoice(normalizedId, payload);
      setPurchaseInvoices((prev) =>
        prev.map((i) => (i.id === normalizedId ? { ...i, ...invoice } : i))
      );
      toast.success('تم تحديث فاتورة الشراء بنجاح');
    } catch (error: unknown) {
      const msg = getApiErrorMessage(error);
      toast.error(msg ?? 'حدث خطأ أثناء تحديث فاتورة الشراء');
      throw error;
    }
  };

  const deletePurchaseInvoice = async (id: string) => {
    const normalizedId = id != null ? String(id).trim() : '';
    if (!normalizedId) {
      toast.error('معرف الفاتورة غير صالح');
      return;
    }
    try {
      const invoice = purchaseInvoices.find((i) => i.id === normalizedId);
      await purchaseInvoiceService.deleteInvoice(normalizedId);
      setPurchaseInvoices((prev) => prev.filter((i) => i.id !== normalizedId));
      addNotification({
        title: 'حذف فاتورة شراء',
        message: `تم حذف فاتورة الشراء من "${invoice?.supplierName}"`,
        time: 'الآن',
        read: false,
      });
      toast.success('تم حذف فاتورة الشراء بنجاح');
    } catch (error: unknown) {
      const msg = getApiErrorMessage(error);
      toast.error(msg ?? 'حدث خطأ أثناء حذف فاتورة الشراء');
      throw error;
    }
  };

  // Shifts functions - integrated with API (same data on المبيعات and الورديات)
  const addShift = async (shift: Omit<Shift, 'id' | 'userId'>) => {
    if (!currentUser) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }
    try {
      const created = await shiftService.createShift({
        userId: currentUser.id,
        startTime: shift.startTime,
        endTime: shift.endTime ?? '',
        startingCash: shift.startingCash,
        totalSales: shift.totalSales ?? 0,
        totalExpenses: shift.totalExpenses ?? 0,
        finalCash: shift.finalCash ?? 0,
        status: shift.status,
        date: shift.date,
        cashier: shift.cashier,
        salesDetails: shift.salesDetails,
      });
      const raw = unwrapData<Record<string, unknown>>(created) ?? (created as Record<string, unknown>);
      const newShift = raw && typeof raw === 'object'
        ? mapBackendShiftsToContext([raw])[0]
        : null;
      const shiftToAdd: Shift = newShift
        ? {
            ...newShift,
            id: newShift.id || String(Date.now()),
            userId: String(newShift.userId || currentUser.id),
            cashier:
              (newShift.cashier && !/undefined/i.test(String(newShift.cashier).trim()))
                ? String(newShift.cashier).trim()
                : shift.cashier || 'كاشير',
            totalSales: newShift.totalSales ?? shift.totalSales ?? 0,
            totalExpenses: newShift.totalExpenses ?? shift.totalExpenses ?? 0,
            salesDetails:
              newShift.salesDetails &&
              (newShift.salesDetails.cash ||
                newShift.salesDetails.card ||
                newShift.salesDetails.instapay)
                ? newShift.salesDetails
                : shift.salesDetails ?? { cash: 0, card: 0, instapay: 0 },
          }
        : {
            id: String(
              (raw && typeof raw === 'object'
                ? (raw as Record<string, unknown>).id ?? (raw as Record<string, unknown>)._id
                : null) ?? Date.now()
            ),
            userId: String(currentUser.id),
            startTime: shift.startTime,
            endTime: shift.endTime ?? '',
            startingCash: shift.startingCash,
            totalSales: shift.totalSales ?? 0,
            totalExpenses: shift.totalExpenses ?? 0,
            finalCash: shift.finalCash ?? 0,
            status: shift.status,
            date: shift.date,
            cashier: shift.cashier || 'كاشير',
            salesDetails: shift.salesDetails ?? { cash: 0, card: 0, instapay: 0 },
          };
      setShifts((prev) => [...prev, shiftToAdd]);
      toast.success('تم فتح الوردية بنجاح');
    } catch (error: unknown) {
      const msg = getApiErrorMessage(error);
      toast.error(msg ?? 'حدث خطأ أثناء فتح الوردية');
      throw error;
    }
  };

  const updateShift = async (id: string, shift: Partial<Shift>) => {
    const normalizedId = id != null ? String(id).trim() : '';
    if (!normalizedId) {
      toast.error('معرف الوردية غير صالح');
      return;
    }
    try {
      const payload: Record<string, unknown> = {};
      if (shift.startTime != null) payload.startTime = shift.startTime;
      if (shift.endTime != null) payload.endTime = shift.endTime;
      if (shift.startingCash != null) payload.startingCash = shift.startingCash;
      if (shift.totalSales != null) payload.totalSales = shift.totalSales;
      if (shift.totalExpenses != null) payload.totalExpenses = shift.totalExpenses;
      if (shift.finalCash != null) payload.finalCash = shift.finalCash;
      if (shift.status != null) payload.status = shift.status;
      if (shift.date != null) payload.date = shift.date;
      if (shift.cashier != null) payload.cashier = shift.cashier;
      if (shift.salesDetails != null) payload.salesDetails = shift.salesDetails;

      await shiftService.updateShift(normalizedId, payload);
      setShifts((prev) =>
        prev.map((s) => (s.id === normalizedId ? { ...s, ...shift } : s))
      );
      toast.success('تم تحديث الوردية بنجاح');
    } catch (error: unknown) {
      const msg = getApiErrorMessage(error);
      toast.error(msg ?? 'حدث خطأ أثناء تحديث الوردية');
      throw error;
    }
  };

  const closeShift = async (id: string) => {
    const normalizedId = id != null ? String(id).trim() : '';
    if (!normalizedId) {
      toast.error('معرف الوردية غير صالح');
      return;
    }
    try {
      await shiftService.updateShift(normalizedId, { status: 'closed' });
      setShifts((prev) =>
        prev.map((s) =>
          s.id === normalizedId ? { ...s, status: 'closed' as const } : s
        )
      );
      toast.success('تم إغلاق الوردية بنجاح');
    } catch (error: unknown) {
      const msg = getApiErrorMessage(error);
      toast.error(msg ?? 'حدث خطأ أثناء إغلاق الوردية');
      throw error;
    }
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
    fetchShifts,
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