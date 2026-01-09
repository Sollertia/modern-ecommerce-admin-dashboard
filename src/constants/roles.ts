/**
 * 관리자 권한 상수
 * 문자열 리터럴 대신 상수를 사용하여 타입 안정성과 유지보수성 향상
 */

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  OPERATION_ADMIN: 'OPERATION_ADMIN',
  CS_ADMIN: 'CS_ADMIN',
} as const;

/**
 * 역할 표시용 라벨 (UI에서 사용)
 */
export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: '슈퍼 관리자',
  OPERATION_ADMIN: '운영 관리자',
  CS_ADMIN: 'CS 관리자',
};

export const USER_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
  PENDING: 'PENDING',
  REJECTED: 'REJECTED',
} as const;

export const USER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: '활성',
  INACTIVE: '비활성',
  SUSPENDED: '정지',
  PENDING: '승인대기',
  REJECTED: '거부',
};

export const CUSTOMER_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;

export const CUSTOMER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: '활성',
  INACTIVE: '비활성',
  SUSPENDED: '정지',
};

export const ORDER_STATUS = {
  PREPARING: 'PREPARING',
  SHIPPING: 'SHIPPING',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PREPARING: '준비중',
  SHIPPING: '배송중',
  DELIVERED: '배송완료',
  CANCELLED: '취소됨',
};

export const PRODUCT_STATUS = {
  AVAILABLE: 'AVAILABLE',
  SOLD_OUT: 'SOLD_OUT',
  DISCONTINUED: 'DISCONTINUED',
} as const;

export const PRODUCT_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: '판매중',
  SOLD_OUT: '품절',
  DISCONTINUED: '단종',
};

export const PRODUCT_CATEGORIES = {
  ELECTRONICS: 'ELECTRONICS',
  FASHION: 'FASHION',
  FOOD: 'FOOD',
  LIVING: 'LIVING',
  SPORTS: 'SPORTS',
  BEAUTY: 'BEAUTY',
  BOOKS: 'BOOKS',
  TOYS: 'TOYS',
} as const;

export const PRODUCT_CATEGORY_LABELS: Record<string, string> = {
  ELECTRONICS: '전자기기',
  FASHION: '패션/의류',
  FOOD: '식품',
  LIVING: '생활용품',
  SPORTS: '스포츠/레저',
  BEAUTY: '뷰티/화장품',
  BOOKS: '도서',
  TOYS: '완구/취미',
};

// Type exports for TypeScript
export type UserRole = typeof ROLES[keyof typeof ROLES];
export type UserStatus = typeof USER_STATUS[keyof typeof USER_STATUS];
export type CustomerStatus = typeof CUSTOMER_STATUS[keyof typeof CUSTOMER_STATUS];
export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];
export type ProductStatus = typeof PRODUCT_STATUS[keyof typeof PRODUCT_STATUS];
export type ProductCategory = typeof PRODUCT_CATEGORIES[keyof typeof PRODUCT_CATEGORIES];
