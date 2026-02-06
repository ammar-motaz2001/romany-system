import { apiService } from './api.service';
import { API_ENDPOINTS } from '../config/api.config';

export interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  duration?: string;
  image?: string;
  active?: boolean;
  salesCount?: number;
}

export interface CreateServiceData {
  name: string;
  category: string;
  price: number;
  duration?: string;
  image?: string;
  active?: boolean;
}

export interface UpdateServiceData extends Partial<CreateServiceData> {}

class ServiceService {
  // Get all services
  async getAllServices(): Promise<Service[]> {
    return apiService.get<Service[]>(API_ENDPOINTS.SERVICES.GET_ALL);
  }

  // Get service categories
  async getCategories(): Promise<string[]> {
    return apiService.get<string[]>(API_ENDPOINTS.SERVICES.GET_CATEGORIES);
  }

  // Get service by ID
  async getServiceById(id: string): Promise<Service> {
    return apiService.get<Service>(API_ENDPOINTS.SERVICES.GET_BY_ID(id));
  }

  // Create service
  async createService(data: CreateServiceData): Promise<Service> {
    return apiService.post<Service>(API_ENDPOINTS.SERVICES.CREATE, data);
  }

  // Update service
  async updateService(id: string, data: UpdateServiceData): Promise<Service> {
    return apiService.put<Service>(API_ENDPOINTS.SERVICES.UPDATE(id), data);
  }

  // Delete service
  async deleteService(id: string): Promise<void> {
    return apiService.delete<void>(API_ENDPOINTS.SERVICES.DELETE(id));
  }
}

export const serviceService = new ServiceService();
export default serviceService;
