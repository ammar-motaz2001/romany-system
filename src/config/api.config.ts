// API Configuration – base URL must include /api to match backend (app.use('/api/...', routes))
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'https://backend-twice.vercel.app/api';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile',
    UPDATE_PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
    USERS: '/auth/users',
    UPDATE_PERMISSIONS: (id: string) => `/auth/users/${id}/permissions`,
    TOGGLE_STATUS: (id: string) => `/auth/users/${id}/toggle-status`,
  },

  // Customers
  CUSTOMERS: {
    GET_ALL: '/customers',
    GET_BY_ID: (id: string) => `/customers/${id}`,
    CREATE: '/customers',
    UPDATE: (id: string) => `/customers/${id}`,
    DELETE: (id: string) => `/customers/${id}`,
    GET_HISTORY: (id: string) => `/customers/${id}/history`,
    INCREMENT_VISIT: (id: string) => `/customers/${id}/increment-visit`,
    UPDATE_SPENDING: (id: string) => `/customers/${id}/update-spending`,
  },

  // Services
  SERVICES: {
    GET_ALL: '/services',
    GET_CATEGORIES: '/services/categories',
    GET_BY_ID: (id: string) => `/services/${id}`,
    CREATE: '/services',
    UPDATE: (id: string) => `/services/${id}`,
    DELETE: (id: string) => `/services/${id}`,
  },

  // Appointments
  APPOINTMENTS: {
    GET_ALL: '/appointments',
    GET_BY_ID: (id: string) => `/appointments/${id}`,
    CREATE: '/appointments',
    UPDATE: (id: string) => `/appointments/${id}`,
    DELETE: (id: string) => `/appointments/${id}`,
    UPDATE_STATUS: (id: string) => `/appointments/${id}/status`,
  },

  // Sales
  SALES: {
    GET_ALL: '/sales',
    GET_BY_ID: (id: string) => `/sales/${id}`,
    CREATE: '/sales',
    REFUND: (id: string) => `/sales/${id}/refund`,
    DAILY_REPORT: '/sales/report/daily',
  },

  // Inventory
  INVENTORY: {
    GET_ALL: '/inventory',
    GET_LOW_STOCK: '/inventory/low-stock',
    GET_BY_ID: (id: string) => `/inventory/${id}`,
    CREATE: '/inventory',
    UPDATE: (id: string) => `/inventory/${id}`,
    UPDATE_STOCK: (id: string) => `/inventory/${id}/stock`,
    DELETE: (id: string) => `/inventory/${id}`,
  },

  // Attendance
  ATTENDANCE: {
    GET_ALL: '/attendance',
    GET_REPORT: '/attendance/report',
    CHECK_IN: '/attendance/check-in',
    CHECK_OUT: (id: string) => `/attendance/check-out/${id}`,
    ADD_ADVANCE: (id: string) => `/attendance/${id}/advance`,
    CREATE_MANUAL: '/attendance/manual',
    CREATE: '/attendance',
    UPDATE: (id: string) => `/attendance/${id}`,
    DELETE: (id: string) => `/attendance/${id}`,
  },

  // Expenses
  EXPENSES: {
    GET_ALL: '/expenses',
    BY_CATEGORY: '/expenses/by-category',
    MONTHLY_REPORT: '/expenses/report/monthly',
    GET_BY_ID: (id: string) => `/expenses/${id}`,
    CREATE: '/expenses',
    PROCESS_RECURRING: '/expenses/process-recurring',
    UPDATE: (id: string) => `/expenses/${id}`,
    DELETE: (id: string) => `/expenses/${id}`,
  },

  // Shifts
  SHIFTS: {
    GET_ALL: '/shifts',
    GET_BY_ID: (id: string) => `/shifts/${id}`,
    CREATE: '/shifts',
    UPDATE: (id: string) => `/shifts/${id}`,
    DELETE: (id: string) => `/shifts/${id}`,
  },

  // Employees
  EMPLOYEES: {
    GET_ALL: '/employees',
    GET_POSITIONS: '/employees/positions',
    GET_STATS: '/employees/stats',
    GET_BY_ID: (id: string) => `/employees/${id}`,
    GET_PAYSLIP: (id: string) => `/employees/${id}/payroll`,
    CREATE: '/employees',
    UPDATE: (id: string) => `/employees/${id}`,
    TERMINATE: (id: string) => `/employees/${id}/terminate`,
    REACTIVATE: (id: string) => `/employees/${id}/reactivate`,
    DELETE: (id: string) => `/employees/${id}`,
  },

  // Reports
  REPORTS: {
    SALES: '/reports/sales',
    REVENUE: '/reports/revenue',
    CUSTOMERS: '/reports/customers',
    SERVICES: '/reports/services',
    ATTENDANCE: '/reports/attendance',
    EXPENSES: '/reports/expenses',
    DASHBOARD: '/reports/dashboard',
  },

  // Settings
  SETTINGS: {
    GET: '/settings',
    UPDATE: '/settings',
    BUSINESS: '/settings/business',
    WORKING_HOURS: '/settings/working-hours',
    APPOINTMENTS: '/settings/appointments',
    PAYMENTS: '/settings/payments',
    INVOICES: '/settings/invoices',
    NOTIFICATIONS: '/settings/notifications',
    THEME: '/settings/theme',
    RESET: '/settings/reset',
  },

  // Notifications
  NOTIFICATIONS: {
    GET_ALL: '/notifications',
    UNREAD_COUNT: '/notifications/unread-count',
    GET_BY_ID: (id: string) => `/notifications/${id}`,
    CREATE: '/notifications',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
    DELETE: (id: string) => `/notifications/${id}`,
    DELETE_ALL_READ: '/notifications/read/all',
    CLEANUP: '/notifications/cleanup',
  },
};
