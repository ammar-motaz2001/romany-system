import { apiService } from './api.service';
import { API_ENDPOINTS } from '../config/api.config';

export interface Appointment {
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

export interface CreateAppointmentData {
  customer: string;
  customerPhone?: string;
  service: string;
  time: string;
  duration: string;
  status: string;
  date: string;
  specialist?: string;
}

export interface UpdateAppointmentData extends Partial<CreateAppointmentData> {}

class AppointmentService {
  // Get all appointments
  async getAllAppointments(): Promise<Appointment[]> {
    return apiService.get<Appointment[]>(API_ENDPOINTS.APPOINTMENTS.GET_ALL);
  }

  // Get appointment by ID
  async getAppointmentById(id: string): Promise<Appointment> {
    return apiService.get<Appointment>(API_ENDPOINTS.APPOINTMENTS.GET_BY_ID(id));
  }

  // Create appointment
  async createAppointment(data: CreateAppointmentData): Promise<Appointment> {
    return apiService.post<Appointment>(API_ENDPOINTS.APPOINTMENTS.CREATE, data);
  }

  // Update appointment
  async updateAppointment(id: string, data: UpdateAppointmentData): Promise<Appointment> {
    return apiService.put<Appointment>(API_ENDPOINTS.APPOINTMENTS.UPDATE(id), data);
  }

  // Update appointment status
  async updateAppointmentStatus(id: string, status: string): Promise<Appointment> {
    return apiService.patch<Appointment>(API_ENDPOINTS.APPOINTMENTS.UPDATE_STATUS(id), { status });
  }

  // Delete appointment
  async deleteAppointment(id: string): Promise<void> {
    return apiService.delete<void>(API_ENDPOINTS.APPOINTMENTS.DELETE(id));
  }
}

export const appointmentService = new AppointmentService();
export default appointmentService;
