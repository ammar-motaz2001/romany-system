import { apiService } from './api.service';
import { API_ENDPOINTS } from '../config/api.config';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  name: string;
  position: string;
  checkIn: string;
  checkOut: string;
  workHours?: string | number;
  status: string;
  date: string;
  image?: string;
  advance?: number;
  day?: string;
  notes?: string;
}

export interface CheckInData {
  employeeId: string;
  employeeName: string;
  position: string;
  checkIn: string;
  date: string;
  notes?: string;
}

export interface CheckOutData {
  checkOut: string;
}

export interface AddAdvanceData {
  amount: number;
  notes?: string;
}

export interface ManualAttendanceData {
  employeeId: string;
  employeeName: string;
  position: string;
  checkIn: string;
  checkOut: string;
  date: string;
  advance?: number;
  notes?: string;
}

class AttendanceService {
  // Get all attendance records
  async getAllAttendance(): Promise<AttendanceRecord[]> {
    return apiService.get<AttendanceRecord[]>(API_ENDPOINTS.ATTENDANCE.GET_ALL);
  }

  // Get attendance report
  async getAttendanceReport(startDate?: string, endDate?: string): Promise<any> {
    return apiService.get<any>(API_ENDPOINTS.ATTENDANCE.GET_REPORT, {
      params: { startDate, endDate }
    });
  }

  // Check in
  async checkIn(data: CheckInData): Promise<AttendanceRecord> {
    return apiService.post<AttendanceRecord>(API_ENDPOINTS.ATTENDANCE.CHECK_IN, data);
  }

  // Check out
  async checkOut(id: string, data: CheckOutData): Promise<AttendanceRecord> {
    return apiService.patch<AttendanceRecord>(API_ENDPOINTS.ATTENDANCE.CHECK_OUT(id), data);
  }

  // Add advance
  async addAdvance(id: string, data: AddAdvanceData): Promise<AttendanceRecord> {
    return apiService.patch<AttendanceRecord>(API_ENDPOINTS.ATTENDANCE.ADD_ADVANCE(id), data);
  }

  // Create manual attendance
  async createManualAttendance(data: ManualAttendanceData): Promise<AttendanceRecord> {
    return apiService.post<AttendanceRecord>(API_ENDPOINTS.ATTENDANCE.CREATE_MANUAL, data);
  }
}

export const attendanceService = new AttendanceService();
export default attendanceService;
