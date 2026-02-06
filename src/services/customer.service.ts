import apiService from './api.service';
import { API_ENDPOINTS } from '../config/api.config';

export interface Customer {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  address?: string;
  notes?: string;
  totalVisits: number;
  totalSpent: number;
  lastVisit?: string;
  nextAppointment?: string;
  isActive: boolean;
}

class CustomerService {
  // Get all customers
  async getAll(params?: {
    search?: string;
    isActive?: boolean;
    sortBy?: string;
  }): Promise<any> {
    return await apiService.get(API_ENDPOINTS.CUSTOMERS.GET_ALL, { params });
  }

  // Get customer by ID
  async getById(id: string): Promise<any> {
    return await apiService.get(API_ENDPOINTS.CUSTOMERS.GET_BY_ID(id));
  }

  // Create customer
  async create(data: Partial<Customer>): Promise<any> {
    return await apiService.post(API_ENDPOINTS.CUSTOMERS.CREATE, data);
  }

  // Update customer
  async update(id: string, data: Partial<Customer>): Promise<any> {
    return await apiService.put(API_ENDPOINTS.CUSTOMERS.UPDATE(id), data);
  }

  // Delete customer
  async delete(id: string): Promise<any> {
    return await apiService.delete(API_ENDPOINTS.CUSTOMERS.DELETE(id));
  }

  // Get customer history
  async getHistory(id: string): Promise<any> {
    return await apiService.get(API_ENDPOINTS.CUSTOMERS.GET_HISTORY(id));
  }

  // Increment visit count
  async incrementVisit(id: string): Promise<any> {
    return await apiService.post(API_ENDPOINTS.CUSTOMERS.INCREMENT_VISIT(id));
  }

  // Update spending
  async updateSpending(id: string, amount: number): Promise<any> {
    return await apiService.post(API_ENDPOINTS.CUSTOMERS.UPDATE_SPENDING(id), {
      amount,
    });
  }
}

export const customerService = new CustomerService();
export default customerService;
