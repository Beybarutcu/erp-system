import axios, { AxiosInstance } from "axios";

// API base URL - update this to match your backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Extend AxiosInstance to include custom methods
interface ExtendedAxiosInstance extends AxiosInstance {
  setToken: (accessToken: string, refreshToken?: string) => void;
  clearToken: () => void;
}

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
}) as ExtendedAxiosInstance;

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login if unauthorized
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Add token management methods
apiClient.setToken = (accessToken: string, refreshToken?: string) => {
  localStorage.setItem("token", accessToken);
  if (refreshToken) {
    localStorage.setItem("refreshToken", refreshToken);
  }
};

apiClient.clearToken = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
};

// ==================== PRODUCTS API ====================
export const productsApi = {
  getAll: async (params?: any) => {
    const response = await apiClient.get("/products", { params });
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await apiClient.post("/products", data);
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/products/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  },
};

// ==================== WORK ORDERS API ====================
export const workOrdersApi = {
  getAll: async (params?: any) => {
    const response = await apiClient.get("/work-orders", { params });
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await apiClient.get(`/work-orders/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await apiClient.post("/work-orders", data);
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/work-orders/${id}`, data);
    return response.data;
  },
  
  recordProduction: async (data: any) => {
    const response = await apiClient.post("/work-orders/record-production", data);
    return response.data;
  },
  
  updateStatus: async (id: string, status: string) => {
    const response = await apiClient.patch(`/work-orders/${id}/status`, { status });
    return response.data;
  },
};

// ==================== INVENTORY API ====================
export const inventoryApi = {
  getLots: async (params?: any) => {
    const response = await apiClient.get("/inventory/lots", { params });
    return response.data;
  },
  
  getLotById: async (id: string) => {
    const response = await apiClient.get(`/inventory/lots/${id}`);
    return response.data;
  },
  
  consumeStock: async (data: any) => {
    const response = await apiClient.post("/inventory/consume", data);
    return response.data;
  },
  
  transferStock: async (data: any) => {
    const response = await apiClient.post("/inventory/transfer", data);
    return response.data;
  },
  
  getMovements: async (params?: any) => {
    const response = await apiClient.get("/inventory/movements", { params });
    return response.data;
  },
};

// ==================== BOM API ====================
export const bomApi = {
  getAll: async (params?: any) => {
    const response = await apiClient.get("/bom", { params });
    return response.data;
  },
  
  getByProductId: async (productId: string) => {
    const response = await apiClient.get(`/bom/product/${productId}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await apiClient.post("/bom", data);
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/bom/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await apiClient.delete(`/bom/${id}`);
    return response.data;
  },
};

// ==================== WAREHOUSE API ====================
export const warehouseApi = {
  getLocations: async (params?: any) => {
    const response = await apiClient.get("/warehouse/locations", { params });
    return response.data;
  },
  
  getLocationById: async (id: string) => {
    const response = await apiClient.get(`/warehouse/locations/${id}`);
    return response.data;
  },
  
  createLocation: async (data: any) => {
    const response = await apiClient.post("/warehouse/locations", data);
    return response.data;
  },
  
  updateLocation: async (id: string, data: any) => {
    const response = await apiClient.put(`/warehouse/locations/${id}`, data);
    return response.data;
  },
  
  deleteLocation: async (id: string) => {
    const response = await apiClient.delete(`/warehouse/locations/${id}`);
    return response.data;
  },
};

// ==================== PURCHASE ORDERS API ====================
export const purchaseOrdersApi = {
  getAll: async (params?: any) => {
    const response = await apiClient.get("/purchase-orders", { params });
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await apiClient.get(`/purchase-orders/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await apiClient.post("/purchase-orders", data);
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/purchase-orders/${id}`, data);
    return response.data;
  },
  
  updateStatus: async (id: string, status: string) => {
    const response = await apiClient.patch(`/purchase-orders/${id}/status`, { status });
    return response.data;
  },
  
  receiveItems: async (id: string, data: any) => {
    const response = await apiClient.post(`/purchase-orders/${id}/receive`, data);
    return response.data;
  },
};

// ==================== MOLDS API ====================
export const moldsApi = {
  getAll: async (params?: any) => {
    const response = await apiClient.get("/molds", { params });
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await apiClient.get(`/molds/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await apiClient.post("/molds", data);
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/molds/${id}`, data);
    return response.data;
  },
  
  recordShots: async (id: string, shots: number) => {
    const response = await apiClient.post(`/molds/${id}/record-shots`, { shots });
    return response.data;
  },
  
  scheduleMaintenance: async (id: string, data: any) => {
    const response = await apiClient.post(`/molds/${id}/maintenance`, data);
    return response.data;
  },
};

// ==================== QUALITY API ====================
export const qualityApi = {
  getInspections: async (params?: any) => {
    const response = await apiClient.get("/quality/inspections", { params });
    return response.data;
  },
  
  getInspectionById: async (id: string) => {
    const response = await apiClient.get(`/quality/inspections/${id}`);
    return response.data;
  },
  
  createInspection: async (data: any) => {
    const response = await apiClient.post("/quality/inspections", data);
    return response.data;
  },
  
  updateInspection: async (id: string, data: any) => {
    const response = await apiClient.put(`/quality/inspections/${id}`, data);
    return response.data;
  },
  
  recordResults: async (id: string, data: any) => {
    const response = await apiClient.post(`/quality/inspections/${id}/results`, data);
    return response.data;
  },
};

// ==================== PERSONNEL API ====================
export const personnelApi = {
  getAll: async (params?: any) => {
    const response = await apiClient.get("/personnel", { params });
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await apiClient.get(`/personnel/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await apiClient.post("/personnel", data);
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/personnel/${id}`, data);
    return response.data;
  },
  
  updateStatus: async (id: string, status: string) => {
    const response = await apiClient.patch(`/personnel/${id}/status`, { status });
    return response.data;
  },
};

// ==================== SAMPLES API ====================
export const samplesApi = {
  getAll: async (params?: any) => {
    const response = await apiClient.get("/samples", { params });
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await apiClient.get(`/samples/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await apiClient.post("/samples", data);
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/samples/${id}`, data);
    return response.data;
  },
  
  updateStatus: async (id: string, status: string) => {
    const response = await apiClient.patch(`/samples/${id}/status`, { status });
    return response.data;
  },
};

// ==================== AUTH API ====================
export const authApi = {
  login: async (username: string, password: string) => {
    const response = await apiClient.post("/auth/login", { username, password });
    return response.data;
  },
  
  logout: async () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  },
  
  getCurrentUser: async () => {
    const response = await apiClient.get("/auth/me");
    return response.data;
  },

  me: async () => {
    const response = await apiClient.get("/auth/me");
    return response.data;
  },
};

// ==================== DASHBOARD/STATS API ====================
export const dashboardApi = {
  getStats: async () => {
    const response = await apiClient.get("/dashboard/stats");
    return response.data;
  },
  
  getProductionTrend: async (days: number = 7) => {
    const response = await apiClient.get("/dashboard/production-trend", {
      params: { days },
    });
    return response.data;
  },
  
  getInventoryStatus: async () => {
    const response = await apiClient.get("/dashboard/inventory-status");
    return response.data;
  },
};

export default apiClient;