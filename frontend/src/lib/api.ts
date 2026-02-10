import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired, try to refresh
          const refreshed = await this.refreshToken();
          if (refreshed && error.config) {
            return this.client.request(error.config);
          }
          // Redirect to login
          this.clearToken();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  }

  private getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refreshToken');
    }
    return null;
  }

  setToken(accessToken: string, refreshToken?: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
    }
  }

  clearToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) return false;

      const response = await axios.post(`${API_URL}/api/auth/refresh`, {
        refreshToken,
      });

      if (response.data.success) {
        this.setToken(response.data.data.accessToken, response.data.data.refreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Generic request methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();

// API Services
export const authApi = {
  login: (username: string, password: string) =>
    apiClient.post('/auth/login', { username, password }),
  
  logout: () => apiClient.post('/auth/logout'),
  
  me: () => apiClient.get('/auth/me'),
  
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.put('/auth/change-password', data),
};

export const productsApi = {
  getAll: (params?: any) => apiClient.get('/products', { params }),
  
  getById: (id: string) => apiClient.get(`/products/${id}`),
  
  create: (data: any) => apiClient.post('/products', data),
  
  update: (id: string, data: any) => apiClient.put(`/products/${id}`, data),
  
  delete: (id: string) => apiClient.delete(`/products/${id}`),
  
  search: (query: string) => apiClient.get('/products/search', { params: { q: query } }),
};

export const bomApi = {
  getTree: (productId: string) => apiClient.get(`/bom/products/${productId}/bom/tree`),
  
  explode: (productId: string, quantity: number) =>
    apiClient.post(`/bom/products/${productId}/bom/explode`, { quantity }),
  
  create: (productId: string, data: any) =>
    apiClient.post(`/bom/products/${productId}/bom`, data),
  
  generateWorkOrders: (productId: string, data: any) =>
    apiClient.post(`/bom/products/${productId}/bom/generate-work-orders`, data),
};

export const inventoryApi = {
  getLots: (params?: any) => apiClient.get('/inventory/lots', { params }),
  
  getAvailable: (params?: any) => apiClient.get('/inventory/available', { params }),
  
  consumeStock: (data: any) => apiClient.post('/inventory/consume', data),
  
  getAging: (params?: any) => apiClient.get('/inventory/aging', { params }),
  
  createLot: (data: any) => apiClient.post('/inventory/lots', data),
};

export const workOrdersApi = {
  getAll: (params?: any) => apiClient.get('/work-orders', { params }),
  
  getById: (id: string) => apiClient.get(`/work-orders/${id}`),
  
  create: (data: any) => apiClient.post('/work-orders', data),
  
  start: (id: string, data?: any) => apiClient.post(`/work-orders/${id}/start`, data),
  
  recordProduction: (id: string, data: any) =>
    apiClient.post(`/work-orders/${id}/record-production`, data),
  
  pause: (id: string, reason?: string) =>
    apiClient.post(`/work-orders/${id}/pause`, { reason }),
  
  resume: (id: string) => apiClient.post(`/work-orders/${id}/resume`),
  
  complete: (id: string) => apiClient.post(`/work-orders/${id}/complete`),
  
  getTimeline: (id: string) => apiClient.get(`/work-orders/${id}/timeline`),
};

export const machinesApi = {
  getAll: (params?: any) => apiClient.get('/machines', { params }),
  
  getById: (id: string) => apiClient.get(`/machines/${id}`),
  
  getUtilization: (id: string, params: any) =>
    apiClient.get(`/machines/${id}/utilization`, { params }),
  
  getSchedule: (id: string, params: any) =>
    apiClient.get(`/machines/${id}/schedule`, { params }),
  
  create: (data: any) => apiClient.post('/machines', data),
  
  update: (id: string, data: any) => apiClient.put(`/machines/${id}`, data),
  
  scheduleMaintenance: (id: string, data: any) =>
    apiClient.post(`/machines/${id}/maintenance`, data),
};

export const capacityApi = {
  getOverview: (params: { startDate: string; endDate: string }) =>
    apiClient.get('/capacity/overview', { params }),
  
  getForecast: (days: number = 30) =>
    apiClient.get('/capacity/forecast', { params: { days } }),
  
  calculate: (data: any) => apiClient.post('/capacity/calculate', data),
};

export default apiClient;
