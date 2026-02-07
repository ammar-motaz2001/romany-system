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
  permissions?: Record<string, boolean>;
}

/** Payload for creating a user (admin) – matches backend POST /api/users */
export interface CreateUserData {
  username: string;
  password: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'cashier';
  image?: string;
  permissions?: Record<string, boolean>;
}

/** Payload for updating a user – matches backend PUT /api/users/:id */
export interface UpdateUserData {
  username?: string;
  password?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: 'admin' | 'cashier';
  image?: string;
  permissions?: Record<string, boolean>;
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

  /** Change password – PUT /api/users/:id/change-password. For own account pass currentPassword; admin can change any user without currentPassword. */
  async changePassword(
    userId: string,
    payload: { newPassword: string; currentPassword?: string }
  ): Promise<any> {
    return await apiService.put(
      API_ENDPOINTS.AUTH.USER_CHANGE_PASSWORD(userId),
      { newPassword: payload.newPassword.trim(), currentPassword: payload.currentPassword?.trim() }
    );
  }

  // Get all users (admin only) – GET /api/users
  async getAllUsers(): Promise<any> {
    return await apiService.get(API_ENDPOINTS.AUTH.USERS);
  }

  // Get single user (admin only) – GET /api/users/:id
  async getUserById(id: string): Promise<any> {
    return await apiService.get(API_ENDPOINTS.AUTH.USER_BY_ID(id));
  }

  // Create user (admin only) – POST /api/users
  async createUser(data: CreateUserData): Promise<any> {
    return await apiService.post(API_ENDPOINTS.AUTH.USERS, data);
  }

  // Update user (admin only) – PUT /api/users/:id
  async updateUser(id: string, data: UpdateUserData): Promise<any> {
    return await apiService.put(API_ENDPOINTS.AUTH.USER_BY_ID(id), data);
  }

  // Delete user (admin only) – DELETE /api/users/:id
  async deleteUser(id: string): Promise<any> {
    return await apiService.delete(API_ENDPOINTS.AUTH.USER_BY_ID(id));
  }
}

export const authService = new AuthService();
export default authService;
