import { apiService } from './api.service';
import { API_ENDPOINTS } from '../config/api.config';

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  category?: string;
  status?: string;
  specialist?: string;
  customer?: string;
}

class ReportService {
  // Get sales report
  async getSalesReport(filters?: ReportFilters): Promise<any> {
    return apiService.get<any>(API_ENDPOINTS.REPORTS.SALES, {
      params: filters
    });
  }

  // Get revenue report
  async getRevenueReport(filters?: ReportFilters): Promise<any> {
    return apiService.get<any>(API_ENDPOINTS.REPORTS.REVENUE, {
      params: filters
    });
  }

  // Get customers report
  async getCustomersReport(filters?: ReportFilters): Promise<any> {
    return apiService.get<any>(API_ENDPOINTS.REPORTS.CUSTOMERS, {
      params: filters
    });
  }

  // Get services report
  async getServicesReport(filters?: ReportFilters): Promise<any> {
    return apiService.get<any>(API_ENDPOINTS.REPORTS.SERVICES, {
      params: filters
    });
  }

  // Get attendance report
  async getAttendanceReport(filters?: ReportFilters): Promise<any> {
    return apiService.get<any>(API_ENDPOINTS.REPORTS.ATTENDANCE, {
      params: filters
    });
  }

  // Get expenses report
  async getExpensesReport(filters?: ReportFilters): Promise<any> {
    return apiService.get<any>(API_ENDPOINTS.REPORTS.EXPENSES, {
      params: filters
    });
  }

  // Get dashboard report
  async getDashboardReport(): Promise<any> {
    return apiService.get<any>(API_ENDPOINTS.REPORTS.DASHBOARD);
  }
}

export const reportService = new ReportService();
export default reportService;
