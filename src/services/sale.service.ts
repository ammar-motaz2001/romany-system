import { apiService } from './api.service';
import { API_ENDPOINTS } from '../config/api.config';

export interface SaleItem {
  name: string;
  quantity: number;
  price: number;
  customPrice?: number;
  notes?: string;
}

export interface Sale {
  id: string;
  customer: string;
  customerPhone?: string;
  service: string;
  amount: number;
  discount?: number;
  status: string;
  date: string;
  category?: string;
  items?: SaleItem[];
  paymentMethod?: string;
  notes?: string;
}

export interface CreateSaleData {
  customer: string;
  customerPhone?: string;
  service: string;
  amount: number;
  discount?: number;
  status: string;
  date: string;
  category?: string;
  items?: SaleItem[];
  paymentMethod?: string;
  notes?: string;
}

class SaleService {
  // Get all sales
  async getAllSales(): Promise<Sale[]> {
    return apiService.get<Sale[]>(API_ENDPOINTS.SALES.GET_ALL);
  }

  // Get sale by ID
  async getSaleById(id: string): Promise<Sale> {
    return apiService.get<Sale>(API_ENDPOINTS.SALES.GET_BY_ID(id));
  }

  // Create sale
  async createSale(data: CreateSaleData): Promise<Sale> {
    return apiService.post<Sale>(API_ENDPOINTS.SALES.CREATE, data);
  }

  // Refund sale
  async refundSale(id: string): Promise<Sale> {
    return apiService.post<Sale>(API_ENDPOINTS.SALES.REFUND(id));
  }

  // Get daily report
  async getDailyReport(date?: string): Promise<any> {
    return apiService.get<any>(API_ENDPOINTS.SALES.DAILY_REPORT, {
      params: { date }
    });
  }
}

export const saleService = new SaleService();
export default saleService;
