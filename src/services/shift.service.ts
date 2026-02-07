import { apiService } from './api.service';
import { API_ENDPOINTS } from '../config/api.config';

export interface Shift {
  id: string;
  userId: string;
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

export interface CreateShiftData {
  userId: string;
  startTime: string;
  endTime?: string;
  startingCash: number;
  totalSales?: number;
  totalExpenses?: number;
  finalCash?: number;
  status: 'open' | 'closed';
  date: string;
  cashier: string;
  salesDetails?: {
    cash: number;
    card: number;
    instapay: number;
  };
}

export interface UpdateShiftData extends Partial<CreateShiftData> {}

class ShiftService {
  async getAllShifts(params?: { status?: string }): Promise<Shift[]> {
    return apiService.get<Shift[]>(API_ENDPOINTS.SHIFTS.GET_ALL, { params });
  }

  async getShiftById(id: string): Promise<Shift> {
    return apiService.get<Shift>(API_ENDPOINTS.SHIFTS.GET_BY_ID(id));
  }

  async createShift(data: CreateShiftData): Promise<Shift> {
    return apiService.post<Shift>(API_ENDPOINTS.SHIFTS.CREATE, data);
  }

  async updateShift(id: string, data: UpdateShiftData): Promise<Shift> {
    return apiService.put<Shift>(API_ENDPOINTS.SHIFTS.UPDATE(id), data);
  }

  async deleteShift(id: string): Promise<void> {
    return apiService.delete<void>(API_ENDPOINTS.SHIFTS.DELETE(id));
  }
}

export const shiftService = new ShiftService();
export default shiftService;
