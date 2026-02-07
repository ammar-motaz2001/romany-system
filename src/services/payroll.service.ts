import { apiService } from './api.service';
import { API_ENDPOINTS } from '../config/api.config';

/** Payslip data returned by GET /employees/:id/payroll?month=&year= */
export interface PayslipResponse {
  employeeId?: string;
  month: number;
  year: number;
  baseSalary: number;
  commission: number;
  overtimePay: number;
  totalEarnings: number;
  totalDeductions: number;
  netSalary: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  leaveDays: number;
  totalWorkHours: number;
  overtimeHours: number;
  totalLateMinutes: number;
  salaryNote?: string;
  lateDeduction: number;
  absentDeduction: number;
  customDeductions: number;
  advances: number;
  totalSalesAmount?: number;
  advanceDetails?: { date: string; amount: number }[];
}

export interface GetPayslipParams {
  month: number;
  year: number;
}

class PayrollService {
  async getEmployeePayslip(
    employeeId: string,
    params: GetPayslipParams
  ): Promise<PayslipResponse> {
    return apiService.get<PayslipResponse>(
      API_ENDPOINTS.EMPLOYEES.GET_PAYSLIP(employeeId),
      { params: { month: params.month, year: params.year } }
    );
  }
}

export const payrollService = new PayrollService();
export default payrollService;
