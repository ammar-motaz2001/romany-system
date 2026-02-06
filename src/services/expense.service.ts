import { apiService } from './api.service';
import { API_ENDPOINTS } from '../config/api.config';

export interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  paymentMethod?: string;
  recurring?: boolean;
  recurringType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  notes?: string;
  status?: string;
}

export interface CreateExpenseData {
  description: string;
  category: string;
  amount: number;
  date: string;
  paymentMethod?: string;
  recurring?: boolean;
  recurringType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  notes?: string;
}

export interface UpdateExpenseData extends Partial<CreateExpenseData> {}

class ExpenseService {
  // Get all expenses
  async getAllExpenses(): Promise<Expense[]> {
    return apiService.get<Expense[]>(API_ENDPOINTS.EXPENSES.GET_ALL);
  }

  // Get expenses by category
  async getExpensesByCategory(): Promise<any> {
    return apiService.get<any>(API_ENDPOINTS.EXPENSES.BY_CATEGORY);
  }

  // Get monthly expense report
  async getMonthlyReport(year?: number, month?: number): Promise<any> {
    return apiService.get<any>(API_ENDPOINTS.EXPENSES.MONTHLY_REPORT, {
      params: { year, month }
    });
  }

  // Get expense by ID
  async getExpenseById(id: string): Promise<Expense> {
    return apiService.get<Expense>(API_ENDPOINTS.EXPENSES.GET_BY_ID(id));
  }

  // Create expense
  async createExpense(data: CreateExpenseData): Promise<Expense> {
    return apiService.post<Expense>(API_ENDPOINTS.EXPENSES.CREATE, data);
  }

  // Process recurring expenses
  async processRecurringExpenses(): Promise<any> {
    return apiService.post<any>(API_ENDPOINTS.EXPENSES.PROCESS_RECURRING);
  }

  // Update expense
  async updateExpense(id: string, data: UpdateExpenseData): Promise<Expense> {
    return apiService.put<Expense>(API_ENDPOINTS.EXPENSES.UPDATE(id), data);
  }

  // Delete expense
  async deleteExpense(id: string): Promise<void> {
    return apiService.delete<void>(API_ENDPOINTS.EXPENSES.DELETE(id));
  }
}

export const expenseService = new ExpenseService();
export default expenseService;
