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
  wholesaleAmount?: number;
  /** المدفوع – from API; backend also may return as paidAmount */
  paidAmount: number;
  /** Alias for paidAmount when reading from API that uses saleAmount */
  saleAmount?: number;
  /** الباقي – from API only, do not compute on frontend */
  remainingAmount: number;
  /** الحالة – from API only */
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
  /** مبلغ الجمله */
  wholesaleAmount?: number;
  /** المدفوع – required for API */
  paidAmount: number;
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
  wholesaleAmount?: number;
  /** المدفوع – backend also accepts saleAmount / paid_amount */
  paidAmount?: number;
  paymentMethod?: 'نقدي' | 'آجل' | 'مختلط';
  notes?: string;
}

class PurchaseInvoiceService {
  private baseURL = '/purchase-invoices';
  private STORAGE_KEY = 'purchase_invoices_data';
  private COUNTER_KEY = 'purchase_invoice_counter';

  // Helper methods for localStorage
  /** Normalize invoice from API: ensure paidAmount, remainingAmount, and supplier ID (supplier may be populated object) */
  private normalizeInvoice(inv: Record<string, unknown>): PurchaseInvoice {
    const paid = Number(inv.paidAmount ?? inv.saleAmount ?? inv.paid_amount ?? 0);
    const supplierRaw = inv.supplier;
    const supplierId =
      typeof supplierRaw === 'object' && supplierRaw !== null && '_id' in supplierRaw
        ? String((supplierRaw as { _id: string })._id)
        : String(supplierRaw ?? '');
    return {
      ...inv,
      supplier: supplierId,
      paidAmount: paid,
      saleAmount: inv.saleAmount ?? paid,
      remainingAmount: Number(inv.remainingAmount ?? 0),
      status: (inv.status as PurchaseInvoice['status']) || 'غير مدفوعة',
    } as PurchaseInvoice;
  }

  private normalizeInvoicesList(data: unknown): PurchaseInvoice[] {
    const list = Array.isArray(data) ? data : [];
    return list.map((inv: Record<string, unknown>) => this.normalizeInvoice(inv));
  }

  private getFromLocalStorage(): PurchaseInvoice[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      const invoices = data ? JSON.parse(data) : [];
      return invoices.map((inv: any) => this.normalizeInvoice(inv));
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
      return this.normalizeInvoicesList(response.data);
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
      return this.normalizeInvoice(response.data as unknown as Record<string, unknown>);
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
      const response = await api.get<{ success: boolean; data: PurchaseInvoice[] }>(
        `${this.baseURL}/supplier/${supplierId}`
      );
      return this.normalizeInvoicesList(response.data);
    } catch (error: any) {
      if (error.response?.status === 404 || !error.response) {
        const invoices = this.getFromLocalStorage();
        return invoices.filter(i => i.supplier === supplierId);
      }
      throw error;
    }
  }

  async createInvoice(data: CreatePurchaseInvoiceDTO): Promise<PurchaseInvoice> {
    const payload = {
      supplier: data.supplier,
      date: data.date,
      items: data.items,
      wholesaleAmount: data.wholesaleAmount ?? 0,
      paidAmount: data.paidAmount,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
    };
    try {
      const response = await api.post<{ success: boolean; data: PurchaseInvoice }>(
        this.baseURL,
        payload
      );
      return this.normalizeInvoice(response.data as unknown as Record<string, unknown>);
    } catch (error: any) {
      if (error.response?.status === 404 || !error.response) {
        const invoices = this.getFromLocalStorage();
        const itemsWithTotals = data.items.map(item => ({
          ...item,
          totalPrice: item.quantity * item.unitPrice,
        }));
        const totalAmount = itemsWithTotals.reduce((sum, item) => sum + item.totalPrice, 0);
        const wholesaleAmount = data.wholesaleAmount ?? 0;
        const effectiveTotal = wholesaleAmount > 0 ? wholesaleAmount : totalAmount;
        const paid = data.paidAmount;
        const remainingAmount = effectiveTotal - paid;
        let status: 'مدفوعة' | 'جزئية' | 'غير مدفوعة' = 'غير مدفوعة';
        if (paid >= effectiveTotal) status = 'مدفوعة';
        else if (paid > 0) status = 'جزئية';
        const newInvoice: PurchaseInvoice = {
          _id: Date.now().toString(),
          invoiceNumber: this.getNextInvoiceNumber(),
          supplier: data.supplier,
          supplierName: this.getSupplierNameFromId(data.supplier),
          date: data.date || new Date().toISOString().split('T')[0],
          items: itemsWithTotals,
          totalAmount,
          wholesaleAmount,
          paidAmount: paid,
          remainingAmount,
          status,
          paymentMethod: data.paymentMethod || 'نقدي',
          notes: data.notes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        invoices.push(newInvoice);
        this.saveToLocalStorage(invoices);
        this.updateSupplierBalance(data.supplier, remainingAmount);
        return newInvoice;
      }
      throw error;
    }
  }

  async updateInvoice(id: string, data: UpdatePurchaseInvoiceDTO): Promise<PurchaseInvoice> {
    const payload: Record<string, unknown> = { ...data };
    if (data.paidAmount !== undefined) {
      payload.paidAmount = data.paidAmount;
    }
    try {
      const response = await api.put<{ success: boolean; data: PurchaseInvoice }>(
        `${this.baseURL}/${id}`,
        payload
      );
      return this.normalizeInvoice(response.data as unknown as Record<string, unknown>);
    } catch (error: any) {
      if (error.response?.status === 404 || !error.response) {
        const invoices = this.getFromLocalStorage();
        const index = invoices.findIndex(i => i._id === id);
        if (index === -1) throw new Error('الفاتورة غير موجودة');
        const oldInvoice = invoices[index];
        let itemsWithTotals = oldInvoice.items;
        let totalAmount = oldInvoice.totalAmount;
        if (data.items?.length) {
          itemsWithTotals = data.items.map(item => ({
            ...item,
            totalPrice: item.quantity * item.unitPrice,
          }));
          totalAmount = itemsWithTotals.reduce((sum, item) => sum + item.totalPrice, 0);
        }
        const wholesaleAmount = data.wholesaleAmount ?? oldInvoice.wholesaleAmount ?? 0;
        const effectiveTotal = wholesaleAmount > 0 ? wholesaleAmount : totalAmount;
        const paid = data.paidAmount ?? oldInvoice.paidAmount;
        const remainingAmount = effectiveTotal - paid;
        let status: 'مدفوعة' | 'جزئية' | 'غير مدفوعة' = 'غير مدفوعة';
        if (paid >= effectiveTotal) status = 'مدفوعة';
        else if (paid > 0) status = 'جزئية';
        invoices[index] = {
          ...oldInvoice,
          supplier: data.supplier ?? oldInvoice.supplier,
          supplierName: data.supplier ? this.getSupplierNameFromId(data.supplier) : oldInvoice.supplierName,
          date: data.date ?? oldInvoice.date,
          items: itemsWithTotals,
          totalAmount,
          wholesaleAmount,
          paidAmount: paid,
          remainingAmount,
          status,
          paymentMethod: data.paymentMethod ?? oldInvoice.paymentMethod,
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
      const response = await api.put<{ success: boolean; data: PurchaseInvoice }>(
        `${this.baseURL}/${id}/payment`,
        { amount }
      );
      return this.normalizeInvoice(response.data as unknown as Record<string, unknown>);
    } catch (error: any) {
      if (error.response?.status === 404 || !error.response) {
        const invoices = this.getFromLocalStorage();
        const index = invoices.findIndex(i => i._id === id);
        if (index === -1) throw new Error('الفاتورة غير موجودة');
        const invoice = invoices[index];
        const effectiveTotal =
          (invoice.wholesaleAmount && invoice.wholesaleAmount > 0)
            ? invoice.wholesaleAmount
            : invoice.totalAmount;
        const newPaid = invoice.paidAmount + amount;
        const newRemaining = Math.max(0, effectiveTotal - newPaid);
        let status: 'مدفوعة' | 'جزئية' | 'غير مدفوعة' = 'غير مدفوعة';
        if (newPaid >= effectiveTotal) status = 'مدفوعة';
        else if (newPaid > 0) status = 'جزئية';
        invoices[index] = {
          ...invoice,
          paidAmount: newPaid,
          remainingAmount: newRemaining,
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

export const purchaseInvoiceService = new PurchaseInvoiceService();
export default purchaseInvoiceService;