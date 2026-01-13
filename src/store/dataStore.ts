import { create } from 'zustand';
import type { User, Customer, Product, Order, Review } from '../types';
import { usersApi, customersApi, productsApi, ordersApi, reviewsApi, QueryParams } from '../api';

// 대시보드 갱신 이벤트 발생 헬퍼 함수
const notifyDashboardUpdate = () => {
  window.dispatchEvent(new CustomEvent('dashboard-update'));
};

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface DataState {
  users: User[];
  customers: Customer[];
  products: Product[];
  orders: Order[];
  reviews: Review[];
  usersPagination: PaginationState | null;
  customersPagination: PaginationState | null;
  productsPagination: PaginationState | null;
  ordersPagination: PaginationState | null;
  reviewsPagination: PaginationState | null;
  isLoading: boolean;
  error: string | null;

  // Fetch Actions
  fetchUsers: (params?: QueryParams) => Promise<void>;
  fetchCustomers: (params?: QueryParams) => Promise<void>;
  fetchProducts: (params?: QueryParams) => Promise<void>;
  fetchOrders: (params?: QueryParams) => Promise<void>;
  fetchReviews: (params?: QueryParams) => Promise<void>;
  
  // Fetch All Actions (No Pagination)
  fetchAllCustomers: () => Promise<void>;
  fetchAllProducts: () => Promise<void>;

  // User Actions
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: string, user: Partial<User>) => Promise<void>;
  updateUserRole: (id: string, role: string) => Promise<void>;
  updateUserStatus: (id: string, status: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  approveUser: (id: string) => Promise<void>;
  rejectUser: (id: string, rejectionReason: string) => Promise<void>;

  // Customer Actions
  addCustomer: (customer: Omit<Customer, 'id'>) => Promise<void>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  updateCustomerStatus: (id: string, status: string) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;

  // Product Actions
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, product: Pick<Product, 'name' | 'category' | 'price'>) => Promise<void>;
  updateProductStock: (id: string, stock: number) => Promise<void>;
  updateProductStatus: (id: string, status: string) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  // Order Actions
  addOrder: (order: Omit<Order, 'id'>) => Promise<void>;
  updateOrderStatus: (id: string, status: string, cancellationReason?: string) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;

  // Review Actions
  addReview: (review: Omit<Review, 'id'>) => Promise<void>;
  updateReview: (id: string, review: Partial<Review>) => Promise<void>;
  deleteReview: (id: string) => Promise<void>;
}

export const useDataStore = create<DataState>((set) => ({
  users: [],
  customers: [],
  products: [],
  orders: [],
  reviews: [],
  usersPagination: null,
  customersPagination: null,
  productsPagination: null,
  ordersPagination: null,
  reviewsPagination: null,
  isLoading: false,
  error: null,

  // Fetch Actions
  fetchUsers: async (params?: QueryParams) => {
    set({ isLoading: true, error: null });
    try {
      const response = await usersApi.getAll(params);
      set({ users: response.items, usersPagination: response.pagination, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchCustomers: async (params?: QueryParams) => {
    set({ isLoading: true, error: null });
    try {
      const response = await customersApi.getAll(params);
      set({ customers: response.items, customersPagination: response.pagination, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchProducts: async (params?: QueryParams) => {
    set({ isLoading: true, error: null });
    try {
      const response = await productsApi.getAll(params);
      set({ products: response.items, productsPagination: response.pagination, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchOrders: async (params?: QueryParams) => {
    set({ isLoading: true, error: null });
    try {
      const response = await ordersApi.getAll(params);
      set({ orders: response.items, ordersPagination: response.pagination, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchReviews: async (params?: QueryParams) => {
    set({ isLoading: true, error: null });
    try {
      const response = await reviewsApi.getAll(params);
      set({ reviews: response.items, reviewsPagination: response.pagination, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  // Fetch All Actions (No Pagination)
  fetchAllCustomers: async () => {
    set({ isLoading: true, error: null });
    try {
      const customers = await customersApi.getAllNoPagination();
      set({ customers, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchAllProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const products = await productsApi.getAllNoPagination();
      set({ products, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  // User Actions
  addUser: async (user) => {
    set({ isLoading: true, error: null });
    try {
      const newUser = await usersApi.create(user);
      set((state) => ({
        users: [...state.users, newUser],
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateUser: async (id, userData) => {
    set({ isLoading: true, error: null });
    try {
      const updatedUser = await usersApi.update(id, userData);
      set((state) => ({
        users: state.users.map((user) =>
          user.id === id ? updatedUser : user
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateUserRole: async (id, role) => {
    set({ isLoading: true, error: null });
    try {
      const updatedUser = await usersApi.updateRole(id, role);
      set((state) => ({
        users: state.users.map((user) =>
          user.id === id ? updatedUser : user
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateUserStatus: async (id, status) => {
    set({ isLoading: true, error: null });
    try {
      const updatedUser = await usersApi.updateStatus(id, status);
      set((state) => ({
        users: state.users.map((user) =>
          user.id === id ? updatedUser : user
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteUser: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await usersApi.delete(id);
      set((state) => ({
        users: state.users.filter((user) => user.id !== id),
        isLoading: false,
      }));
      notifyDashboardUpdate();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  approveUser: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const updatedUser = await usersApi.approve(id);
      set((state) => ({
        users: state.users.map((user) => (user.id === id ? updatedUser : user)),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  rejectUser: async (id, rejectionReason) => {
    set({ isLoading: true, error: null });
    try {
      const updatedUser = await usersApi.reject(id, rejectionReason);
      set((state) => ({
        users: state.users.map((user) => (user.id === id ? updatedUser : user)),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  // Customer Actions
  addCustomer: async (customer) => {
    set({ isLoading: true, error: null });
    try {
      const newCustomer = await customersApi.create(customer);
      set((state) => ({
        customers: [...state.customers, newCustomer],
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateCustomer: async (id, customerData) => {
    set({ isLoading: true, error: null });
    try {
      const updatedCustomer = await customersApi.update(id, customerData);
      set((state) => ({
        customers: state.customers.map((customer) =>
          customer.id === id ? updatedCustomer : customer
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateCustomerStatus: async (id, status) => {
    set({ isLoading: true, error: null });
    try {
      const updatedCustomer = await customersApi.updateStatus(id, status);
      set((state) => ({
        customers: state.customers.map((customer) =>
          customer.id === id ? updatedCustomer : customer
        ),
        isLoading: false,
      }));
      notifyDashboardUpdate();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteCustomer: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await customersApi.delete(id);
      set((state) => ({
        customers: state.customers.filter((customer) => customer.id !== id),
        isLoading: false,
      }));
      notifyDashboardUpdate();
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // Product Actions
  addProduct: async (product) => {
    set({ isLoading: true, error: null });
    try {
      const newProduct = await productsApi.create(product);
      set((state) => ({
        products: [...state.products, newProduct],
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateProduct: async (id, productData) => {
    set({ isLoading: true, error: null });
    try {
      const updatedProduct = await productsApi.update(id, productData);
      set((state) => ({
        products: state.products.map((product) =>
          product.id === id ? updatedProduct : product
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateProductStock: async (id, stock) => {
    set({ isLoading: true, error: null });
    try {
      const updatedProduct = await productsApi.updateStock(id, stock);
      set((state) => ({
        products: state.products.map((product) =>
          product.id === id ? updatedProduct : product
        ),
        isLoading: false,
      }));
      notifyDashboardUpdate();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateProductStatus: async (id, status) => {
    set({ isLoading: true, error: null });
    try {
      const updatedProduct = await productsApi.updateStatus(id, status);
      set((state) => ({
        products: state.products.map((product) =>
          product.id === id ? updatedProduct : product
        ),
        isLoading: false,
      }));
      notifyDashboardUpdate();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteProduct: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await productsApi.delete(id);
      set((state) => ({
        products: state.products.filter((product) => product.id !== id),
        isLoading: false,
      }));
      notifyDashboardUpdate();
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // Order Actions
  addOrder: async (order) => {
    set({ isLoading: true, error: null });
    try {
      const newOrder = await ordersApi.create(order);
      set((state) => ({
        orders: [...state.orders, newOrder],
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateOrderStatus: async (id, status, cancellationReason) => {
    set({ isLoading: true, error: null });
    try {
      const updatedOrder = await ordersApi.updateStatus(id, status, cancellationReason);
      set((state) => ({
        orders: state.orders.map((order) =>
          order.id === id ? updatedOrder : order
        ),
        isLoading: false,
      }));
      notifyDashboardUpdate();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteOrder: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await ordersApi.delete(id);
      set((state) => ({
        orders: state.orders.filter((order) => order.id !== id),
        isLoading: false,
      }));
      notifyDashboardUpdate();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  // Review Actions
  addReview: async (review) => {
    set({ isLoading: true, error: null });
    try {
      const newReview = await reviewsApi.create(review);
      set((state) => ({
        reviews: [...state.reviews, newReview],
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateReview: async (id, reviewData) => {
    set({ isLoading: true, error: null });
    try {
      const updatedReview = await reviewsApi.update(id, reviewData);
      set((state) => ({
        reviews: state.reviews.map((review) =>
          review.id === id ? updatedReview : review
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteReview: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await reviewsApi.delete(id);
      set((state) => ({
        reviews: state.reviews.filter((review) => review.id !== id),
        isLoading: false,
      }));
      notifyDashboardUpdate();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },
}));
