import type { User, Customer, Product, Order, Review, ApiResponse, PaginatedData } from '../types';
import { useAuthStore } from '../store/authStore';

// Base API configuration
const API_BASE_URL = '/api';

// API 쿼리 파라미터 타입
export interface QueryParams {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: string | number | undefined;
}

// Generic API error handler
class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Authorization 헤더와 캐시 제어 헤더를 포함한 fetch 헤더 생성
 */
function getAuthHeaders(includeContentType = false): HeadersInit {
  const token = useAuthStore.getState().token;
  const headers: HeadersInit = {
    // 강력한 캐시 방지 헤더
    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

/**
 * 쿼리 파라미터를 URL에 추가하는 헬퍼 함수
 * 캐시 방지를 위한 타임스탬프도 추가
 */
function buildQueryString(params?: QueryParams): string {
  const searchParams = new URLSearchParams();

  // 기존 파라미터 추가
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, String(value));
      }
    });
  }

  // 캐시 방지를 위한 타임스탬프 추가
  searchParams.append('_t', Date.now().toString());

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : `?_t=${Date.now()}`;
}

/**
 * 캐시 제어가 적용된 fetch 래퍼
 */
async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // 기본 옵션과 사용자 옵션 병합
  const defaultOptions: RequestInit = {
    cache: 'no-store', // 브라우저 캐싱 방지
    headers: getAuthHeaders(options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH'),
  };

  const mergedOptions: RequestInit = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  return fetch(url, mergedOptions);
}

async function handleResponse<T>(response: Response): Promise<T> {
  // 204 No Content 처리
  if (response.status === 204) {
    return {} as T;
  }

  const jsonResponse: ApiResponse<T> = await response.json().catch(() => ({
    success: false,
    code: 'PARSE_ERROR',
    message: '응답 파싱에 실패했습니다.'
  }));

  // 실패 응답 처리
  if (!jsonResponse.success) {
    throw new ApiError(
      response.status,
      jsonResponse.message || '요청 처리에 실패했습니다.'
    );
  }

  // 성공 응답 - data 필드 반환
  return jsonResponse.data as T;
}

// Users API
export const usersApi = {
  getAll: async (params?: QueryParams): Promise<PaginatedData<User>> => {
    const queryString = buildQueryString(params);
    const response = await apiFetch(`${API_BASE_URL}/users${queryString}`);
    return handleResponse<PaginatedData<User>>(response);
  },

  getById: async (id: string): Promise<User> => {
    const response = await apiFetch(`${API_BASE_URL}/users/${id}`);
    return handleResponse<User>(response);
  },

  create: async (user: Omit<User, 'id'>): Promise<User> => {
    const response = await apiFetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      body: JSON.stringify(user),
    });
    return handleResponse<User>(response);
  },

  update: async (id: string, user: Pick<User, 'name' | 'email' | 'phone'>): Promise<User> => {
    const response = await apiFetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    });
    return handleResponse<User>(response);
  },

  updateRole: async (id: string, role: string): Promise<User> => {
    const response = await apiFetch(`${API_BASE_URL}/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
    return handleResponse<User>(response);
  },

  updateStatus: async (id: string, status: string): Promise<User> => {
    const response = await apiFetch(`${API_BASE_URL}/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return handleResponse<User>(response);
  },

  delete: async (id: string): Promise<void> => {
    const response = await apiFetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(response);
  },

  approve: async (id: string, approvedBy: string): Promise<User> => {
    const response = await apiFetch(`${API_BASE_URL}/users/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approvedBy }),
    });
    return handleResponse<User>(response);
  },

  reject: async (id: string, rejectedBy: string, rejectionReason: string): Promise<User> => {
    const response = await apiFetch(`${API_BASE_URL}/users/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectedBy, rejectionReason }),
    });
    return handleResponse<User>(response);
  },
};

// Customers API
export const customersApi = {
  getAll: async (params?: QueryParams): Promise<PaginatedData<Customer>> => {
    const queryString = buildQueryString(params);
    const response = await apiFetch(`${API_BASE_URL}/customers${queryString}`);
    return handleResponse<PaginatedData<Customer>>(response);
  },

  // 전체 고객 목록 조회 (드롭다운용, 페이징 없음)
  // 기존 API 엔드포인트(/customers)를 사용하되, 파라미터 없이 호출하면 전체 데이터를 반환하도록 수정됨
  getAllNoPagination: async (): Promise<Customer[]> => {
    const response = await apiFetch(`${API_BASE_URL}/customers`);
    // 응답 구조가 { items: [], pagination: ... } 형태일 수 있으므로 처리 필요
    // Mock 핸들러 수정으로 limit이 없으면 전체 데이터를 items에 담아 반환하고
    // pagination 정보도 그에 맞춰서 오므로 items만 추출하면 됨
    const data = await handleResponse<Customer[]>(response);
    return data;
  },

  getById: async (id: string): Promise<Customer> => {
    const response = await apiFetch(`${API_BASE_URL}/customers/${id}`);
    return handleResponse<Customer>(response);
  },

  create: async (customer: Omit<Customer, 'id'>): Promise<Customer> => {
    const response = await apiFetch(`${API_BASE_URL}/customers`, {
      method: 'POST',
      body: JSON.stringify(customer),
    });
    return handleResponse<Customer>(response);
  },

  update: async (id: string, customer: Pick<Customer, 'name' | 'email' | 'phone'>): Promise<Customer> => {
    const response = await apiFetch(`${API_BASE_URL}/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customer),
    });
    return handleResponse<Customer>(response);
  },

  updateStatus: async (id: string, status: string): Promise<Customer> => {
    const response = await apiFetch(`${API_BASE_URL}/customers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return handleResponse<Customer>(response);
  },

  delete: async (id: string): Promise<void> => {
    const response = await apiFetch(`${API_BASE_URL}/customers/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(response);
  },
};

// Products API
export const productsApi = {
  getAll: async (params?: QueryParams): Promise<PaginatedData<Product>> => {
    const queryString = buildQueryString(params);
    const response = await apiFetch(`${API_BASE_URL}/products${queryString}`);
    return handleResponse<PaginatedData<Product>>(response);
  },

  // 전체 상품 목록 조회 (드롭다운용, 페이징 없음)
  // 기존 API 엔드포인트(/products)를 사용하되, 파라미터 없이 호출하면 전체 데이터를 반환하도록 수정됨
  getAllNoPagination: async (): Promise<Product[]> => {
    const response = await apiFetch(`${API_BASE_URL}/products`);
    // 응답 구조가 { items: [], pagination: ... } 형태일 수 있으므로 처리 필요
    const data = await handleResponse<Product[]>(response);
    return data;
  },

  getById: async (id: string): Promise<Product> => {
    const response = await apiFetch(`${API_BASE_URL}/products/${id}`);
    return handleResponse<Product>(response);
  },

  create: async (product: Omit<Product, 'id' | 'createdAt' | 'createdBy' | 'createdByName' | 'createdByEmail' | 'reviewSummary' | 'recentReviews'>): Promise<Product> => {
    const response = await apiFetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      body: JSON.stringify(product),
    });
    return handleResponse<Product>(response);
  },

  update: async (id: string, product: Pick<Product, 'name' | 'category' | 'price'>): Promise<Product> => {
    const response = await apiFetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
    return handleResponse<Product>(response);
  },

  updateStock: async (id: string, stock: number): Promise<Product> => {
    const response = await apiFetch(`${API_BASE_URL}/products/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ stock }),
    });
    return handleResponse<Product>(response);
  },

  updateStatus: async (id: string, status: string): Promise<Product> => {
    const response = await apiFetch(`${API_BASE_URL}/products/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return handleResponse<Product>(response);
  },

  delete: async (id: string): Promise<void> => {
    const response = await apiFetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(response);
  },
};

// Orders API
export const ordersApi = {
  getAll: async (params?: QueryParams): Promise<PaginatedData<Order>> => {
    const queryString = buildQueryString(params);
    const response = await apiFetch(`${API_BASE_URL}/orders${queryString}`);
    return handleResponse<PaginatedData<Order>>(response);
  },

  getById: async (id: string): Promise<Order> => {
    const response = await apiFetch(`${API_BASE_URL}/orders/${id}`);
    return handleResponse<Order>(response);
  },

  create: async (order: Omit<Order, 'id'>): Promise<Order> => {
    const response = await apiFetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      body: JSON.stringify(order),
    });
    return handleResponse<Order>(response);
  },

  updateStatus: async (id: string, status: string, cancellationReason?: string): Promise<Order> => {
    const response = await apiFetch(`${API_BASE_URL}/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, cancellationReason }),
    });
    return handleResponse<Order>(response);
  },

  delete: async (id: string): Promise<void> => {
    const response = await apiFetch(`${API_BASE_URL}/orders/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(response);
  },
};

// Reviews API
export const reviewsApi = {
  getAll: async (params?: QueryParams): Promise<PaginatedData<Review>> => {
    const queryString = buildQueryString(params);
    const response = await apiFetch(`${API_BASE_URL}/reviews${queryString}`);
    return handleResponse<PaginatedData<Review>>(response);
  },

  getById: async (id: string): Promise<Review> => {
    const response = await apiFetch(`${API_BASE_URL}/reviews/${id}`);
    return handleResponse<Review>(response);
  },

  create: async (review: Omit<Review, 'id'>): Promise<Review> => {
    const response = await apiFetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      body: JSON.stringify(review),
    });
    return handleResponse<Review>(response);
  },

  update: async (id: string, review: Partial<Review>): Promise<Review> => {
    const response = await apiFetch(`${API_BASE_URL}/reviews/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(review),
    });
    return handleResponse<Review>(response);
  },

  delete: async (id: string): Promise<void> => {
    const response = await apiFetch(`${API_BASE_URL}/reviews/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(response);
  },
};

// Auth API
export const authApi = {
  getProfile: async (): Promise<User> => {
    const response = await apiFetch(`${API_BASE_URL}/users/me`);
    return handleResponse<User>(response);
  },

  updateProfile: async (data: { name: string; email: string; phone: string }) => {
    const response = await apiFetch(`${API_BASE_URL}/users/me`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return handleResponse<User>(response);
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    const response = await apiFetch(`${API_BASE_URL}/auth/password`, {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return handleResponse<void>(response);
  },

  logout: async (): Promise<void> => {
    const response = await apiFetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
    });
    return handleResponse<void>(response);
  },
};

// Dashboard API
export interface DashboardStats {
  summary: {
    totalUsers: number;
    activeUsers: number;
    totalCustomers: number;
    activeCustomers: number;
    totalProducts: number;
    lowStockProducts: number;
    totalOrders: number;
    todayOrders: number;
    totalReviews: number;
    averageRating: number; // 숫자로 저장, 프론트에서 소수점 표시
  };
  widgets: {
    totalRevenue: number;
    todayRevenue: number;
    preparingOrders: number;
    shippingOrders: number;
    completedOrders: number;
    lowStockProducts: number;
    outOfStockProducts: number;
  };
  charts: {
    reviewRating: { rating: number; count: number }[];
    customerStatus: { status: string; count: number }[];
    productCategory: { category: string; count: number }[];
  };
  recentOrders: Order[];
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiFetch(`${API_BASE_URL}/dashboard/stats`);
    return handleResponse<DashboardStats>(response);
  },
};
