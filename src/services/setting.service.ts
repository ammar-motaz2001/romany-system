import { apiService } from './api.service';
import { API_ENDPOINTS } from '../config/api.config';

export interface SystemSettings {
  businessName?: string;
  businessLogo?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  currency?: string;
  language?: string;
  taxRate?: number;
  workingHours?: {
    [key: string]: { open: string; close: string; closed: boolean };
  };
  appointmentSettings?: {
    allowOnlineBooking?: boolean;
    requireDeposit?: boolean;
    depositAmount?: number;
    cancellationPolicy?: string;
  };
  paymentSettings?: {
    acceptCash?: boolean;
    acceptCard?: boolean;
    acceptInstaPay?: boolean;
  };
  invoiceSettings?: {
    showLogo?: boolean;
    showTaxNumber?: boolean;
    showTerms?: boolean;
    termsText?: string;
  };
  notificationSettings?: {
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    appointmentReminders?: boolean;
    lowStockAlerts?: boolean;
  };
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    darkMode?: boolean;
  };
}

class SettingService {
  // Get all settings
  async getSettings(): Promise<SystemSettings> {
    return apiService.get<SystemSettings>(API_ENDPOINTS.SETTINGS.GET);
  }

  // Update settings
  async updateSettings(data: Partial<SystemSettings>): Promise<SystemSettings> {
    return apiService.put<SystemSettings>(API_ENDPOINTS.SETTINGS.UPDATE, data);
  }

  // Update business settings
  async updateBusinessSettings(data: any): Promise<SystemSettings> {
    return apiService.patch<SystemSettings>(API_ENDPOINTS.SETTINGS.BUSINESS, data);
  }

  // Update working hours
  async updateWorkingHours(data: any): Promise<SystemSettings> {
    return apiService.patch<SystemSettings>(API_ENDPOINTS.SETTINGS.WORKING_HOURS, data);
  }

  // Update appointment settings
  async updateAppointmentSettings(data: any): Promise<SystemSettings> {
    return apiService.patch<SystemSettings>(API_ENDPOINTS.SETTINGS.APPOINTMENTS, data);
  }

  // Update payment settings
  async updatePaymentSettings(data: any): Promise<SystemSettings> {
    return apiService.patch<SystemSettings>(API_ENDPOINTS.SETTINGS.PAYMENTS, data);
  }

  // Update invoice settings
  async updateInvoiceSettings(data: any): Promise<SystemSettings> {
    return apiService.patch<SystemSettings>(API_ENDPOINTS.SETTINGS.INVOICES, data);
  }

  // Update notification settings
  async updateNotificationSettings(data: any): Promise<SystemSettings> {
    return apiService.patch<SystemSettings>(API_ENDPOINTS.SETTINGS.NOTIFICATIONS, data);
  }

  // Update theme settings
  async updateThemeSettings(data: any): Promise<SystemSettings> {
    return apiService.patch<SystemSettings>(API_ENDPOINTS.SETTINGS.THEME, data);
  }

  // Reset all settings
  async resetSettings(): Promise<SystemSettings> {
    return apiService.post<SystemSettings>(API_ENDPOINTS.SETTINGS.RESET);
  }
}

export const settingService = new SettingService();
export default settingService;
