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

/** Payload aligned with backend Mongoose schema (Attendance). */
export interface AttendanceSchemaPayload {
  employeeId: string;
  employeeName?: string;
  name?: string;
  position?: string;
  checkIn?: string;
  checkOut?: string;
  workHours?: number;
  status?: 'حاضر' | 'غائب' | 'تأخير' | 'إجازة' | 'present' | 'absent' | 'delay' | 'leave';
  date: string;
  image?: string;
  advance?: number;
  day?: string;
  notes?: string;
}

export interface AttendanceQueryParams {
  date?: string;
  employeeId?: string;
  status?: string;
}

class AttendanceService {
  // Get all attendance records (supports query: date, employeeId, status)
  async getAllAttendance(params?: AttendanceQueryParams): Promise<AttendanceRecord[] | { success: boolean; data: AttendanceRecord[] }> {
    return apiService.get<AttendanceRecord[] | { success: boolean; data: AttendanceRecord[] }>(
      API_ENDPOINTS.ATTENDANCE.GET_ALL,
      params ? { params } : undefined
    );
  }

  // Create attendance record (POST /api/attendance)
  async createAttendance(data: Record<string, unknown>): Promise<AttendanceRecord | { success: boolean; data: AttendanceRecord }> {
    return apiService.post<AttendanceRecord | { success: boolean; data: AttendanceRecord }>(
      API_ENDPOINTS.ATTENDANCE.CREATE,
      data
    );
  }

  // Update attendance record (PUT /api/attendance/:id)
  async updateAttendance(id: string, data: Record<string, unknown>): Promise<AttendanceRecord | { success: boolean; data: AttendanceRecord }> {
    return apiService.put<AttendanceRecord | { success: boolean; data: AttendanceRecord }>(
      API_ENDPOINTS.ATTENDANCE.UPDATE(id),
      data
    );
  }

  // Delete attendance record (DELETE /api/attendance/:id)
  async deleteAttendance(id: string): Promise<void | { success: boolean }> {
    return apiService.delete<void | { success: boolean }>(API_ENDPOINTS.ATTENDANCE.DELETE(id));
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

  // Create manual attendance (uses POST /api/attendance to match backend)
  async createManualAttendance(data: ManualAttendanceData): Promise<AttendanceRecord> {
    return apiService.post<AttendanceRecord>(API_ENDPOINTS.ATTENDANCE.CREATE, data);
  }
}

export const attendanceService = new AttendanceService();
export default attendanceService;
