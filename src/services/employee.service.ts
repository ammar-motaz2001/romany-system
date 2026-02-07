import { apiService } from './api.service';
import { API_ENDPOINTS } from '../config/api.config';

export interface Employee {
  id: string;
  name: string;
  position: string;
  email?: string;
  phone?: string;
  image?: string;
  salary?: number;
  commission?: number;
  startDate?: string;
  status?: 'active' | 'terminated';
  terminationDate?: string;
  terminationReason?: string;
}

export interface CreateEmployeeData {
  name: string;
  position: string;
  email?: string;
  phone?: string;
  image?: string;
  salary?: number;
  baseSalary?: number;
  commission?: number;
  startDate?: string;
  hireDate?: string;
}

export interface UpdateEmployeeData extends Partial<CreateEmployeeData> {}

export interface TerminateEmployeeData {
  terminationDate: string;
  terminationReason?: string;
}

class EmployeeService {
  // Get all employees
  async getAllEmployees(): Promise<Employee[]> {
    return apiService.get<Employee[]>(API_ENDPOINTS.EMPLOYEES.GET_ALL);
  }

  // Get employee positions
  async getPositions(): Promise<string[]> {
    return apiService.get<string[]>(API_ENDPOINTS.EMPLOYEES.GET_POSITIONS);
  }

  // Get employee stats
  async getEmployeeStats(): Promise<any> {
    return apiService.get<any>(API_ENDPOINTS.EMPLOYEES.GET_STATS);
  }

  // Get employee by ID
  async getEmployeeById(id: string): Promise<Employee> {
    return apiService.get<Employee>(API_ENDPOINTS.EMPLOYEES.GET_BY_ID(id));
  }

  // Create employee
  async createEmployee(data: CreateEmployeeData): Promise<Employee> {
    return apiService.post<Employee>(API_ENDPOINTS.EMPLOYEES.CREATE, data);
  }

  // Update employee
  async updateEmployee(id: string, data: UpdateEmployeeData): Promise<Employee> {
    return apiService.put<Employee>(API_ENDPOINTS.EMPLOYEES.UPDATE(id), data);
  }

  // Terminate employee
  async terminateEmployee(id: string, data: TerminateEmployeeData): Promise<Employee> {
    return apiService.patch<Employee>(API_ENDPOINTS.EMPLOYEES.TERMINATE(id), data);
  }

  // Reactivate employee
  async reactivateEmployee(id: string): Promise<Employee> {
    return apiService.patch<Employee>(API_ENDPOINTS.EMPLOYEES.REACTIVATE(id));
  }

  // Delete employee
  async deleteEmployee(id: string): Promise<void> {
    return apiService.delete<void>(API_ENDPOINTS.EMPLOYEES.DELETE(id));
  }
}

export const employeeService = new EmployeeService();
export default employeeService;
