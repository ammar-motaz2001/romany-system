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
  startTime?: string;
  endTime?: string;
  invoiceSettings?: {
    showLogo?: boolean;
    showTaxNumber?: boolean;
    showTerms?: boolean;
    termsText?: string;
    footerText?: string;
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

/** Display-only settings (for invoices/header) */
export interface DisplaySettings {
  startTime?: string;
  endTime?: string;
  footerText?: string;
  shopName?: string;
  address?: string;
  phone?: string;
}

class SettingService {
  /** Get full settings (for الإعدادات العامة form). Handles { success, data } response. */
  async getSettings(): Promise<SystemSettings> {
    const res = await apiService.get<{ success?: boolean; data?: SystemSettings } | SystemSettings>(
      API_ENDPOINTS.SETTINGS.GET
    );
    const data = res && typeof res === 'object' && 'data' in res && res.data != null ? res.data : res;
    return (data as SystemSettings) ?? {};
  }

  /** Get display-only settings (for invoices/header). Handles { success, data } response. */
  async getDisplaySettings(): Promise<DisplaySettings> {
    const res = await apiService.get<{ success?: boolean; data?: DisplaySettings } | DisplaySettings>(
      API_ENDPOINTS.SETTINGS.GET_DISPLAY
    );
    const data = res && typeof res === 'object' && 'data' in res && res.data != null ? res.data : res;
    return (data as DisplaySettings) ?? {};
  }

  /** Update settings (PUT). Send startTime, endTime, invoiceSettings.footerText and/or full object. */
  async updateSettings(data: Partial<SystemSettings> & { startTime?: string; endTime?: string }): Promise<SystemSettings> {
    const res = await apiService.put<{ success?: boolean; data?: SystemSettings } | SystemSettings>(
      API_ENDPOINTS.SETTINGS.UPDATE,
      data
    );
    const out = res && typeof res === 'object' && 'data' in res && res.data != null ? res.data : res;
    return (out as SystemSettings) ?? {};
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
