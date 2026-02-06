import api from './api.service';

export interface Supplier {
  _id: string;
  name: string;
  phone: string;
  address: string;
  balance: number;
  status: 'نشط' | 'موقوف';
  totalPurchases: number;
  totalPaid: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierDTO {
  name: string;
  phone: string;
  address?: string;
  status?: 'نشط' | 'موقوف';
  notes?: string;
}

export interface UpdateSupplierDTO {
  name?: string;
  phone?: string;
  address?: string;
  status?: 'نشط' | 'موقوف';
  notes?: string;
}

class SupplierService {
  private baseURL = '/suppliers';
  private STORAGE_KEY = 'suppliers_data';

  // Helper method to use localStorage as fallback
  private getFromLocalStorage(): Supplier[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveToLocalStorage(suppliers: Supplier[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(suppliers));
  }

  async getAllSuppliers(): Promise<Supplier[]> {
    try {
      const response = await api.get<{ success: boolean; data: Supplier[] }>(this.baseURL);
      return response.data;
    } catch (error: any) {
      // If 404 or network error, use localStorage instead
      if (error.response?.status === 404 || !error.response) {
        console.log('Using localStorage for suppliers (backend not available)');
        return this.getFromLocalStorage();
      }
      throw error;
    }
  }

  async getSupplierById(id: string): Promise<Supplier> {
    try {
      const response = await api.get<{ success: boolean; data: Supplier }>(`${this.baseURL}/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404 || !error.response) {
        const suppliers = this.getFromLocalStorage();
        const supplier = suppliers.find(s => s._id === id);
        if (!supplier) {
          throw new Error('التاجر غير موجود');
        }
        return supplier;
      }
      throw error;
    }
  }

  async createSupplier(data: CreateSupplierDTO): Promise<Supplier> {
    try {
      const response = await api.post<{ success: boolean; data: Supplier }>(this.baseURL, data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404 || !error.response) {
        // Create in localStorage
        const suppliers = this.getFromLocalStorage();
        const newSupplier: Supplier = {
          _id: Date.now().toString(),
          name: data.name,
          phone: data.phone,
          address: data.address || '',
          balance: 0,
          status: data.status || 'نشط',
          totalPurchases: 0,
          totalPaid: 0,
          notes: data.notes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        suppliers.push(newSupplier);
        this.saveToLocalStorage(suppliers);
        return newSupplier;
      }
      throw error;
    }
  }

  async updateSupplier(id: string, data: UpdateSupplierDTO): Promise<Supplier> {
    try {
      const response = await api.put<{ success: boolean; data: Supplier }>(`${this.baseURL}/${id}`, data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404 || !error.response) {
        const suppliers = this.getFromLocalStorage();
        const index = suppliers.findIndex(s => s._id === id);
        if (index === -1) {
          throw new Error('التاجر غير موجود');
        }
        suppliers[index] = {
          ...suppliers[index],
          ...data,
          updatedAt: new Date().toISOString(),
        };
        this.saveToLocalStorage(suppliers);
        return suppliers[index];
      }
      throw error;
    }
  }

  async deleteSupplier(id: string): Promise<void> {
    try {
      await api.delete(`${this.baseURL}/${id}`);
    } catch (error: any) {
      if (error.response?.status === 404 || !error.response) {
        const suppliers = this.getFromLocalStorage();
        const filtered = suppliers.filter(s => s._id !== id);
        this.saveToLocalStorage(filtered);
        return;
      }
      throw error;
    }
  }

  async updateBalance(id: string, amount: number, type: 'add' | 'subtract'): Promise<Supplier> {
    try {
      const response = await api.put<{ success: boolean; data: Supplier }>(`${this.baseURL}/${id}/balance`, { amount, type });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404 || !error.response) {
        const suppliers = this.getFromLocalStorage();
        const index = suppliers.findIndex(s => s._id === id);
        if (index === -1) {
          throw new Error('التاجر غير موجود');
        }
        if (type === 'add') {
          suppliers[index].balance += amount;
        } else {
          suppliers[index].balance -= amount;
        }
        suppliers[index].updatedAt = new Date().toISOString();
        this.saveToLocalStorage(suppliers);
        return suppliers[index];
      }
      throw error;
    }
  }
}

export default new SupplierService();