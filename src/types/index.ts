// --- Constants Re-exports ---
export type { UserStatus, UserRole, CustomerStatus, ProductStatus, OrderStatus } from '../constants/roles';
import type { UserRole, UserStatus, CustomerStatus, ProductStatus, OrderStatus } from '../constants/roles';

// --- Domain Entities ---

// Admin (Backoffice User)
export interface Admin {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  requestMessage?: string;
}

// Alias for backward compatibility
export type User = Admin;

// Customer (Service User)
export interface Customer {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  status: CustomerStatus;
  createdAt: string;
  totalOrders?: number;
  totalSpent?: string;
}

// Product
export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  fiveStarCount: number;
  fourStarCount: number;
  threeStarCount: number;
  twoStarCount: number;
  oneStarCount: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: string;
  stock: number;
  status: ProductStatus;
  image?: string;
  createdAt: string;
  reviewSummary?: ReviewSummary;
  recentReviews?: Review[];
}

// Order
export interface Order {
  id: string; // 내부 ID (UUID)
  orderNo: string; // 주문번호 (사용자에게 표시)
  customerId: string;
  customer: string;
  customerEmail?: string;
  productId: string;
  product: string;
  quantity: number;
  amount: string;
  date: string;
  status: OrderStatus;
  cancellationReason?: string;
  createdByAdminId?: string;
  createdByAdminName?: string;
  createdByAdminEmail?: string;
  createdByAdminRole?: string;
}

// Review
export interface Review {
  id: string;
  orderId: string;
  productId: string;
  customerId: string;
  customer: string;
  customerEmail: string;
  product: string;
  rating: number;
  comment: string;
  date: string;
}

// --- Auth & API Types ---

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
}

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  code: string;
  message?: string;
  data?: T;
  errors?: FieldError[];
}

export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: PaginationData;
}

// --- Component Props Types ---

export interface Column {
  key: string;
  label: string;
  sortable?: boolean;
}
