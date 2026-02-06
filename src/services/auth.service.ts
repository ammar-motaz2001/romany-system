import apiService from './api.service';
import { API_ENDPOINTS } from '../config/api.config';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  fullName: string;
  role: 'admin' | 'cashier';
  permissions?: any;
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: 'admin' | 'cashier';
  permissions?: any;
  isActive: boolean;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data: {
    token: string;
    user: User;
  };
}

class AuthService {
  // Login – accepts multiple backend shapes: { success, data } or { token, user }
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const raw = await apiService.post<Record<string, unknown>>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials
    );

    const token =
      (raw?.data as { token?: string })?.token ?? (raw?.token as string) ?? (raw?.accessToken as string);
    const user = (raw?.data as { user?: unknown })?.user ?? raw?.user;

    if (token && user) {
      apiService.setAuthToken(token);
      localStorage.setItem('user', JSON.stringify(user));
      return { success: true, data: { token, user: user as User } };
    }

    return (raw as AuthResponse) ?? { success: false, data: { token: '', user: {} as User } };
  }

  // Register
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>(
      API_ENDPOINTS.AUTH.REGISTER,
      data
    );
    
    return response;
  }

  // Logout
  logout() {
    apiService.removeAuthToken();
    window.location.href = '/login';
  }

  // Get current user
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!apiService.getAuthToken();
  }

  // Check if user is admin
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  // Check permission
  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.permissions?.[permission] === true;
  }

  // Get profile
  async getProfile(): Promise<any> {
    const response = await apiService.get(API_ENDPOINTS.AUTH.PROFILE);
    if (response.success && response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response;
  }

  // Update profile
  async updateProfile(data: Partial<User>): Promise<any> {
    const response = await apiService.put(API_ENDPOINTS.AUTH.UPDATE_PROFILE, data);
    if (response.success && response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response;
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<any> {
    return await apiService.put(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
      currentPassword,
      newPassword,
    });
  }

  // Get all users (admin only)
  async getAllUsers(): Promise<any> {
    return await apiService.get(API_ENDPOINTS.AUTH.USERS);
  }

  // Update user permissions (admin only)
  async updatePermissions(userId: string, permissions: any): Promise<any> {
    return await apiService.put(
      API_ENDPOINTS.AUTH.UPDATE_PERMISSIONS(userId),
      { permissions }
    );
  }

  // Toggle user status (admin only)
  async toggleUserStatus(userId: string): Promise<any> {
    return await apiService.put(API_ENDPOINTS.AUTH.TOGGLE_STATUS(userId));
  }
}

export const authService = new AuthService();
export default authService;
