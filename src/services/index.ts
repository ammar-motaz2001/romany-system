// Export all services
export { apiService, default as api } from './api.service';
export { authService, default as auth } from './auth.service';
export { customerService, default as customer } from './customer.service';
export { serviceService, default as service } from './service.service';
export { appointmentService, default as appointment } from './appointment.service';
export { saleService, default as sale } from './sale.service';
export { inventoryService, default as inventory } from './inventory.service';
export { attendanceService, default as attendance } from './attendance.service';
export { expenseService, default as expense } from './expense.service';
export { employeeService, default as employee } from './employee.service';
export { reportService, default as report } from './report.service';
export { settingService, default as setting } from './setting.service';
export { notificationService, default as notification } from './notification.service';
export { default as supplier } from './supplier.service';
export { default as purchaseInvoice } from './purchaseInvoice.service';

// Re-export types
export type { LoginCredentials, RegisterData, User, AuthResponse } from './auth.service';
export type { Customer } from './customer.service';
export type { Service, CreateServiceData, UpdateServiceData } from './service.service';
export type { Appointment, CreateAppointmentData, UpdateAppointmentData } from './appointment.service';
export type { Sale, SaleItem, CreateSaleData } from './sale.service';
export type { InventoryItem, CreateInventoryData, UpdateInventoryData } from './inventory.service';
export type { AttendanceRecord, CheckInData, CheckOutData, AddAdvanceData, ManualAttendanceData } from './attendance.service';
export type { Expense, CreateExpenseData, UpdateExpenseData } from './expense.service';
export type { Employee, CreateEmployeeData, UpdateEmployeeData, TerminateEmployeeData } from './employee.service';
export type { ReportFilters } from './report.service';
export type { SystemSettings } from './setting.service';
export type { Notification, CreateNotificationData } from './notification.service';
export type { Supplier, CreateSupplierDTO, UpdateSupplierDTO } from './supplier.service';
export type { PurchaseInvoice, PurchaseInvoiceItem, CreatePurchaseInvoiceDTO, UpdatePurchaseInvoiceDTO } from './purchaseInvoice.service';