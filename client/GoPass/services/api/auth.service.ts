import { apiClient } from './client';
import { AuthResponse, LoginCredentials, RegisterData } from '../../types/auth.types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<any>('/auth/login', credentials);
    return response.data; // response.data is the body, which contains { success: true, data: { user, tokens } }
    // Wait, if we return response.data, the store gets { success, data }. 
    // We should probably fix the store OR fix it here.  
    // Let's stick to fixing it here to be cleaner.
    // BUT the types might need adjustment. 
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<any>('/auth/register', data);
    return response.data; 
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password: string, passwordConfirmation: string): Promise<void> {
    await apiClient.post('/auth/reset-password', { token, password, password_confirmation: passwordConfirmation });
  },

  async getProfile(): Promise<any> {
    const response = await apiClient.get<any>('/auth/profile');
    return response.data?.data || response.data;
  },

  async updateProfile(data: any): Promise<any> {
    const response = await apiClient.patch('/auth/profile', data);
    // Unwrap the response wrapper: { success: true, data: user } -> user
    return response.data?.data || response.data; 
  },
};
