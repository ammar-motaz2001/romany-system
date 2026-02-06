import api from './api.service';

export interface PurchaseInvoiceItem {
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PurchaseInvoice {
  _id: string;
  invoiceNumber: string;
  supplier: string;
  supplierName: string;
  date: string;
  items: PurchaseInvoiceItem[];
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'مدفوعة' | 'جزئية' | 'غير مدفوعة';
  paymentMethod: 'نقدي' | 'آجل' | 'مختلط';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseInvoiceDTO {
  supplier: string;
  date?: string;
  items: Array<{
    itemName: string;
    quantity: number;
    unitPrice: number;
  }>;
  paidAmount?: number;
  paymentMethod?: 'نقدي' | 'آجل' | 'مختلط';
  notes?: string;
}

export interface UpdatePurchaseInvoiceDTO {
  supplier?: string;
  date?: string;
  items?: Array<{
    itemName: string;
    quantity: number;
    unitPrice: number;
  }>;
  paidAmount?: number;
  paymentMethod?: 'نقدي' | 'آجل' | 'مختلط';
  notes?: string;
}

class PurchaseInvoiceService {
  private baseURL = '/purchase-invoices';
  private STORAGE_KEY = 'purchase_invoices_data';
  private COUNTER_KEY = 'purchase_invoice_counter';

  // Helper methods for localStorage
  private getFromLocalStorage(): PurchaseInvoice[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveToLocalStorage(invoices: PurchaseInvoice[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(invoices));
  }

  private getNextInvoiceNumber(): string {
    try {
      const counter = localStorage.getItem(this.COUNTER_KEY);
      const nextNum = counter ? parseInt(counter) + 1 : 1;
      localStorage.setItem(this.COUNTER_KEY, nextNum.toString());
      return `PI-${nextNum.toString().padStart(5, '0')}`;
    } catch {
      return `PI-${Date.now()}`;
    }
  }

  private getSupplierNameFromId(supplierId: string): string {
    try {
      const suppliersData = localStorage.getItem('suppliers_data');
      if (suppliersData) {
        const suppliers = JSON.parse(suppliersData);
        const supplier = suppliers.find((s: any) => s._id === supplierId);
        return supplier ? supplier.name : 'غير محدد';
      }
    } catch {
      return 'غير محدد';
    }
    return 'غير محدد';
  }

  private updateSupplierBalance(supplierId: string, amount: number): void {
    try {
      const suppliersData = localStorage.getItem('suppliers_data');
      if (suppliersData) {
        const suppliers = JSON.parse(suppliersData);
        const index = suppliers.findIndex((s: any) => s._id === supplierId);
        if (index !== -1) {
          suppliers[index].balance += amount;
          suppliers[index].totalPurchases += amount;
          suppliers[index].updatedAt = new Date().toISOString();
          localStorage.setItem('suppliers_data', JSON.stringify(suppliers));
        }
      }
    } catch (error) {
      console.error('Error updating supplier balance:', error);
    }
  }

  async getAllInvoices(): Promise<PurchaseInvoice[]> {
    try {
      const response = await api.get<{ success: boolean; data: PurchaseInvoice[] }>(this.baseURL);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404 || !error.response) {
        console.log('Using localStorage for invoices (backend not available)');
        return this.getFromLocalStorage();
      }
      throw error;
    }
  }

  async getInvoiceById(id: string): Promise<PurchaseInvoice> {
    try {
      const response = await api.get<{ success: boolean; data: PurchaseInvoice }>(`${this.baseURL}/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404 || !error.response) {
        const invoices = this.getFromLocalStorage();
        const invoice = invoices.find(i => i._id === id);
        if (!invoice) {
          throw new Error('الفاتورة غير موجودة');
        }
        return invoice;
      }
      throw error;
    }
  }

  async getInvoicesBySupplier(supplierId: string): Promise<PurchaseInvoice[]> {
    try {
      const response = await api.get<{ success: boolean; data: PurchaseInvoice[] }>(`${this.baseURL}/supplier/${supplierId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404 || !error.response) {
        const invoices = this.getFromLocalStorage();
        return invoices.filter(i => i.supplier === supplierId);
      }
      throw error;
    }
  }

  async createInvoice(data: CreatePurchaseInvoiceDTO): Promise<PurchaseInvoice> {
    try {
      const response = await api.post<{ success: boolean; data: PurchaseInvoice }>(this.baseURL, data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404 || !error.response) {
        // Create in localStorage
        const invoices = this.getFromLocalStorage();
        
        // Calculate totals
        const itemsWithTotals = data.items.map(item => ({
          ...item,
          totalPrice: item.quantity * item.unitPrice,
        }));
        
        const totalAmount = itemsWithTotals.reduce((sum, item) => sum + item.totalPrice, 0);
        const paidAmount = data.paidAmount || 0;
        const remainingAmount = totalAmount - paidAmount;
        
        let status: 'مدفوعة' | 'جزئية' | 'غير مدفوعة' = 'غير مدفوعة';
        if (paidAmount >= totalAmount) {
          status = 'مدفوعة';
        } else if (paidAmount > 0) {
          status = 'جزئية';
        }
        
        const newInvoice: PurchaseInvoice = {
          _id: Date.now().toString(),
          invoiceNumber: this.getNextInvoiceNumber(),
          supplier: data.supplier,
          supplierName: this.getSupplierNameFromId(data.supplier),
          date: data.date || new Date().toISOString().split('T')[0],
          items: itemsWithTotals,
          totalAmount,
          paidAmount,
          remainingAmount,
          status,
          paymentMethod: data.paymentMethod || 'نقدي',
          notes: data.notes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        invoices.push(newInvoice);
        this.saveToLocalStorage(invoices);
        
        // Update supplier balance
        this.updateSupplierBalance(data.supplier, remainingAmount);
        
        return newInvoice;
      }
      throw error;
    }
  }

  async updateInvoice(id: string, data: UpdatePurchaseInvoiceDTO): Promise<PurchaseInvoice> {
    try {
      const response = await api.put<{ success: boolean; data: PurchaseInvoice }>(`${this.baseURL}/${id}`, data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404 || !error.response) {
        const invoices = this.getFromLocalStorage();
        const index = invoices.findIndex(i => i._id === id);
        if (index === -1) {
          throw new Error('الفاتورة غير موجودة');
        }
        
        const oldInvoice = invoices[index];
        
        // Calculate new totals if items changed
        let itemsWithTotals = oldInvoice.items;
        let totalAmount = oldInvoice.totalAmount;
        
        if (data.items) {
          itemsWithTotals = data.items.map(item => ({
            ...item,
            totalPrice: item.quantity * item.unitPrice,
          }));
          totalAmount = itemsWithTotals.reduce((sum, item) => sum + item.totalPrice, 0);
        }
        
        const paidAmount = data.paidAmount !== undefined ? data.paidAmount : oldInvoice.paidAmount;
        const remainingAmount = totalAmount - paidAmount;
        
        let status: 'مدفوعة' | 'جزئية' | 'غير مدفوعة' = 'غير مدفوعة';
        if (paidAmount >= totalAmount) {
          status = 'مدفوعة';
        } else if (paidAmount > 0) {
          status = 'جزئية';
        }
        
        invoices[index] = {
          ...oldInvoice,
          supplier: data.supplier || oldInvoice.supplier,
          supplierName: data.supplier ? this.getSupplierNameFromId(data.supplier) : oldInvoice.supplierName,
          date: data.date || oldInvoice.date,
          items: itemsWithTotals,
          totalAmount,
          paidAmount,
          remainingAmount,
          status,
          paymentMethod: data.paymentMethod || oldInvoice.paymentMethod,
          notes: data.notes !== undefined ? data.notes : oldInvoice.notes,
          updatedAt: new Date().toISOString(),
        };
        
        this.saveToLocalStorage(invoices);
        return invoices[index];
      }
      throw error;
    }
  }

  async deleteInvoice(id: string): Promise<void> {
    try {
      await api.delete(`${this.baseURL}/${id}`);
    } catch (error: any) {
      if (error.response?.status === 404 || !error.response) {
        const invoices = this.getFromLocalStorage();
        const filtered = invoices.filter(i => i._id !== id);
        this.saveToLocalStorage(filtered);
        return;
      }
      throw error;
    }
  }

  async addPayment(id: string, amount: number): Promise<PurchaseInvoice> {
    try {
      const response = await api.put<{ success: boolean; data: PurchaseInvoice }>(`${this.baseURL}/${id}/payment`, { amount });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404 || !error.response) {
        const invoices = this.getFromLocalStorage();
        const index = invoices.findIndex(i => i._id === id);
        if (index === -1) {
          throw new Error('الفاتورة غير موجودة');
        }
        
        const invoice = invoices[index];
        const newPaidAmount = invoice.paidAmount + amount;
        const newRemainingAmount = invoice.totalAmount - newPaidAmount;
        
        let status: 'مدفوعة' | 'جزئية' | 'غير مدفوعة' = 'غير مدفوعة';
        if (newPaidAmount >= invoice.totalAmount) {
          status = 'مدفوعة';
        } else if (newPaidAmount > 0) {
          status = 'جزئية';
        }
        
        invoices[index] = {
          ...invoice,
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount,
          status,
          updatedAt: new Date().toISOString(),
        };
        
        this.saveToLocalStorage(invoices);
        return invoices[index];
      }
      throw error;
    }
  }
}

export default new PurchaseInvoiceService();