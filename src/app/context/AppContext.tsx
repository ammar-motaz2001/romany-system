import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { translations, Language, TranslationKey } from '@/app/translations';
import { toast } from 'sonner';

// Import Mock Data for frontend-only mode
import {
  mockServices,
  mockCustomers,
  mockAppointments,
  mockSales,
  mockInventory,
  mockAttendance,
  mockEmployees,
  mockExpenses,
} from './MockData';

// Beauty Salon Management System - Main Application Context v4 (Frontend-Only Mode)
// Last Updated: 2026-02-06 - Fixed all service references

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

  const initialUsers: User[] = [
    {
      id: '1',
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      name: 'المدير العام',
      email: 'admin@example.com',
      phone: '01000000000',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
      permissions: {
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
        settings: true,
        suppliers: true,
      },
    },
    {
      id: '2',
      username: 'cashier',
      password: 'cashier123',
      role: 'cashier',
      name: 'الكاشير',
      email: 'cashier@example.com',
      phone: '01111111111',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
      permissions: {
        dashboard: true,
        sales: true,
        invoices: true,
        customers: true,
        appointments: true,
        inventory: false,
        services: false,
        expenses: false,
        shifts: false,
        employees: false,
        attendance: false,
        payroll: false,
        reports: false,
        settings: false,
        suppliers: false,
      },
    },
  ];

  // Load users from localStorage or use initial users
  const loadUsersFromLocalStorage = (): User[] => {
    try {
      const savedUsers = localStorage.getItem('users');
      if (savedUsers) {
        return JSON.parse(savedUsers);
      }
      // First time - save initial users to localStorage
      localStorage.setItem('users', JSON.stringify(initialUsers));
      return initialUsers;
    } catch (error) {
      console.error('Error loading users from localStorage:', error);
      return initialUsers;
    }
  };

  const [users, setUsers] = useState<User[]>(loadUsersFromLocalStorage());
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    // Load current user from localStorage on initialization
    try {
      const savedUser = localStorage.getItem('currentUser');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error('Error loading current user from localStorage:', error);
      return null;
    }
  });
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    shopName: 'صالون الجمال',
    address: 'القاهرة، مصر',
    phone: '01234567890',
    email: 'info@salon.com',
    currency: 'ج.م',
    language: 'ar',
    workingHours: {
      start: '09:00',
      end: '21:00',
    },
    notifications: true,
    darkMode: false,
    invoiceSettings: {
      showLogo: true,
      showAddress: true,
      showPhone: true,
      showEmail: true,
      footer: 'شكراً لزيارتكم - نتمنى لكم تجربة رائعة',
    },
  });

  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load all data from backend on mount
  useEffect(() => {
    loadAllData();
    loadShiftsFromLocalStorage();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Load from localStorage first, fallback to mock data
      const savedSales = localStorage.getItem('sales');
      const savedInventory = localStorage.getItem('inventory');
      
      // Frontend-only mode - Use Mock Data or localStorage
      setServices(mockServices);
      setCustomers(mockCustomers);
      setAppointments(mockAppointments);
      setSales(savedSales ? JSON.parse(savedSales) : mockSales);
      setInventory(savedInventory ? JSON.parse(savedInventory) : mockInventory);
      setAttendanceRecords(mockAttendance);
      setEmployees(mockEmployees);
      setExpenses(mockExpenses);
      console.log('✅ تم تحمي البيانات (Frontend-Only Mode)');
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load shifts from localStorage
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

  // Load functions - Frontend only mode
  const loadServices = async () => {
    setServices(mockServices);
  };

  const loadCustomers = async () => {
    setCustomers(mockCustomers);
  };

  const loadAppointments = async () => {
    setAppointments(mockAppointments);
  };

  const loadSales = async () => {
    setSales(mockSales);
  };

  const loadInventory = async () => {
    setInventory(mockInventory);
  };

  const loadAttendance = async () => {
    setAttendanceRecords(mockAttendance);
  };

  const loadEmployees = async () => {
    setEmployees(mockEmployees);
  };

  const loadExpenses = async () => {
    setExpenses(mockExpenses);
  };

  const loadSettings = async () => {
    // Frontend-only mode - use default settings
    console.log('Using default settings (Frontend-Only Mode)');
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

  // Services functions - Frontend Only
  const addService = async (service: Omit<Service, 'id'>) => {
    const newService = {
      ...service,
      id: Date.now().toString(),
      active: service.active !== false,
      salesCount: 0,
    };
    setServices([...services, newService]);
    addNotification({
      title: 'خدمة جديدة',
      message: `تم إضافة خدمة "${service.name}" بنجاح`,
      time: 'الآن',
      read: false,
    });
    toast.success('تم إضافة الخدمة بنجاح');
  };

  const updateService = async (id: string, service: Partial<Service>) => {
    setServices(
      services.map((s) => (s.id === id ? { ...s, ...service } : s))
    );
    addNotification({
      title: 'تحديث خدمة',
      message: `تم تحديث خدمة "${service.name}" بنجاح`,
      time: 'الآن',
      read: false,
    });
    toast.success('تم تحديث الخدمة بنجاح');
  };

  const deleteService = async (id: string) => {
    const service = services.find((s) => s.id === id);
    setServices(services.filter((s) => s.id !== id));
    addNotification({
      title: 'حذف خدمة',
      message: `تم حذف خدمة "${service?.name}" بنجاح`,
      time: 'الآن',
      read: false,
    });
    toast.success('تم حذف الخدمة بنجاح');
  };

  // Customers functions - Frontend Only
  const addCustomer = async (customer: Omit<Customer, 'id'>): Promise<Customer> => {
    const newCustomer: Customer = {
      id: Date.now().toString(),
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone,
      visits: customer.visits || 0,
      spending: customer.spending || 0,
      vip: customer.vip || false,
      visitHistory: customer.visitHistory || [],
    };
    setCustomers([...customers, newCustomer]);
    addNotification({
      title: 'عميل جديد',
      message: `تم إضافة عميل جديد "${customer.name}"`,
      time: 'الآن',
      read: false,
    });
    toast.success('تم إضافة العميل بنجاح');
    return newCustomer;
  };

  const updateCustomer = async (id: string, customer: Partial<Customer>) => {
    setCustomers(
      customers.map((c) => (c.id === id ? { ...c, ...customer } : c))
    );
    toast.success('تم تحديث العميل بنجاح');
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

  // Sales functions - Frontend Only
  const addSale = async (sale: Omit<Sale, 'id'>) => {
    // Find or create customer
    let customerId = customers.find(c => c.phone === sale.customerPhone)?.id;

    if (!customerId && sale.customer && sale.customerPhone && sale.customer !== 'عميل نقدي') {
      try {
        const newCustomer = await addCustomer({
          name: sale.customer,
          email: '',
          phone: sale.customerPhone,
        });
        customerId = newCustomer.id;
      } catch (error) {
        console.error('Error creating customer:', error);
      }
    }

    // Generate unique invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    const newSale = {
      ...sale,
      id: invoiceNumber,
    };
    
    const updatedSales = [...sales, newSale];
    setSales(updatedSales);
    
    // Save to localStorage for persistence
    localStorage.setItem('sales', JSON.stringify(updatedSales));
    
    //Update customer visits and spending
    if (customerId) {
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        updateCustomer(customerId, {
          visits: (customer.visits || 0) + 1,
          spending: (customer.spending || 0) + sale.amount,
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
  };

  // Inventory functions
  const addInventoryItem = async (item: Omit<InventoryItem, 'id'>) => {
    try {
      // Frontend-only mode: save to localStorage (NO SERVICE CALLS)
      const newItem: InventoryItem = {
        ...item,
        id: Date.now().toString(),
      };

      const updatedInventory = [...inventory, newItem];
      setInventory(updatedInventory);
      localStorage.setItem('inventory', JSON.stringify(updatedInventory));

      addNotification({
        title: 'منتج جدد في المخزون',
        message: `تم إضافة "${item.name}" إلى المخزون`,
        time: 'الآن',
        read: false,
      });
      toast.success('تم إضافة المنتج بنجاح');
    } catch (error: any) {
      console.error('Error adding inventory item:', error);
      toast.error(error.message || 'حدث خطأ أثناء إضافة المنتج');
      throw error;
    }
  };

  const updateInventoryItem = async (id: string, item: Partial<InventoryItem>) => {
    try {
      // Frontend-only mode: update in localStorage
      const updatedInventory = inventory.map((i) =>
        i.id === id ? { ...i, ...item } : i
      );
      setInventory(updatedInventory);
      localStorage.setItem('inventory', JSON.stringify(updatedInventory));

      addNotification({
        title: 'تحديث مخزون',
        message: `تم تحديث بيانات المنتج "${item.name}"`,
        time: 'الآن',
        read: false,
      });
      toast.success('تم تحديث المنتج بنجاح');
    } catch (error: any) {
      console.error('Error updating inventory item:', error);
      toast.error(error.message || 'حدث خطأ أثناء تحديث المنتج');
      throw error;
    }
  };

  const deleteInventoryItem = async (id: string) => {
    try {
      const item = inventory.find((i) => i.id === id);
      
      // Frontend-only mode: delete from localStorage
      const updatedInventory = inventory.filter((i) => i.id !== id);
      setInventory(updatedInventory);
      localStorage.setItem('inventory', JSON.stringify(updatedInventory));

      addNotification({
        title: 'حذف منتج من المخزون',
        message: `تم حذف "${item?.name}" من المخزون`,
        time: 'الآن',
        read: false,
      });
      toast.success('تم حذف المنتج بنجاح');
    } catch (error: any) {
      console.error('Error deleting inventory item:', error);
      toast.error(error.message || 'حدث خطأ أثناء حذف المنتج');
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
      localStorage.setItem('inventory', JSON.stringify(updatedInventory));
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

  // Users functions - Persistent localStorage storage
  const addUser = (user: Omit<User, 'id'>) => {
    const newUser: User = {
      ...user,
      id: Date.now().toString(),
    };
    
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers)); // Save to localStorage
    
    addNotification({
      title: 'مستخدم جديد',
      message: `تم إضافة مستخدم جديد \"${user.name}\"`,
      time: 'الآن',
      read: false,
    });
    toast.success('تم إضافة المستخدم بنجاح');
  };

  const updateUser = (id: string, user: Partial<User>) => {
    const updatedUsers = users.map((u) => (u.id === id ? { ...u, ...user } : u));
    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers)); // Save to localStorage
    
    toast.success('تم تحديث المستخدم بنجاح');
  };

  const deleteUser = (id: string) => {
    const user = users.find((u) => u.id === id);
    const updatedUsers = users.filter((u) => u.id !== id);
    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers)); // Save to localStorage
    
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
      
      const updatedUsers = users.map((u) => (u.id === currentUser.id ? updated : u));
      setUsers(updatedUsers);
      localStorage.setItem('users', JSON.stringify(updatedUsers)); // Save to localStorage
    }
  };

  const loginUser = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      // Save current user to localStorage for persistence
      localStorage.setItem('currentUser', JSON.stringify(user));
      toast.success(`مرحباً ${user.name}`);
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
    // Remove current user from localStorage
    localStorage.removeItem('currentUser');
    toast.success('تم تسجيل الخروج بنجاح');
  };

  // System Settings functions - Frontend Only
  const updateSystemSettings = async (settings: Partial<SystemSettings>) => {
    try {
      // Frontend-only mode: update in state
      setSystemSettings({ ...systemSettings, ...settings });
      toast.success('تم تحديث الإعدادات بنجاح');
    } catch (error: any) {
      console.error('Error updating settings:', error);
      toast.error(error.message || 'حدث خطأ أثناء تحديث الإعدادات');
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

export default AppContext;