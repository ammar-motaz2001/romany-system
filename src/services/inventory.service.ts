import { apiService } from './api.service';
import { API_ENDPOINTS } from '../config/api.config';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  price: number;
  minStock?: number;
  image?: string;
}

export interface CreateInventoryData {
  name: string;
  category: string;
  stock: number;
  price: number;
  minStock?: number;
  image?: string;
}

export interface UpdateInventoryData extends Partial<CreateInventoryData> {}

class InventoryService {
  // Get all inventory items
  async getAllInventory(): Promise<InventoryItem[]> {
    return apiService.get<InventoryItem[]>(API_ENDPOINTS.INVENTORY.GET_ALL);
  }

  // Get low stock items
  async getLowStockItems(): Promise<InventoryItem[]> {
    return apiService.get<InventoryItem[]>(API_ENDPOINTS.INVENTORY.GET_LOW_STOCK);
  }

  // Get inventory item by ID
  async getInventoryById(id: string): Promise<InventoryItem> {
    return apiService.get<InventoryItem>(API_ENDPOINTS.INVENTORY.GET_BY_ID(id));
  }

  // Create inventory item
  async createInventoryItem(data: CreateInventoryData): Promise<InventoryItem> {
    return apiService.post<InventoryItem>(API_ENDPOINTS.INVENTORY.CREATE, data);
  }

  // Update inventory item
  async updateInventoryItem(id: string, data: UpdateInventoryData): Promise<InventoryItem> {
    return apiService.put<InventoryItem>(API_ENDPOINTS.INVENTORY.UPDATE(id), data);
  }

  // Update stock
  async updateStock(id: string, quantity: number, type: 'add' | 'remove'): Promise<InventoryItem> {
    return apiService.patch<InventoryItem>(API_ENDPOINTS.INVENTORY.UPDATE_STOCK(id), {
      quantity,
      type
    });
  }

  // Delete inventory item
  async deleteInventoryItem(id: string): Promise<void> {
    return apiService.delete<void>(API_ENDPOINTS.INVENTORY.DELETE(id));
  }
}

export const inventoryService = new InventoryService();
export default inventoryService;
