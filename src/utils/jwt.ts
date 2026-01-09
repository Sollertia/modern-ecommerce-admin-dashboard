/**
 * JWT 토큰 유틸리티 (MSW 모킹용)
 * 실제 프로덕션에서는 서버에서 JWT 생성/검증을 수행해야 합니다.
 * 이는 교육 목적의 시뮬레이션입니다.
 */

import type { UserRole } from '../types';

interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;  // issued at
  exp: number;  // expiration
}

/**
 * 간단한 Base64 인코딩 (UTF-8 지원)
 * 실제로는 암호화된 JWT 사용
 */
const encode = (obj: any): string => {
  const str = JSON.stringify(obj);
  // UTF-8 문자열을 Base64로 인코딩 (한글 지원)
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => {
    return String.fromCharCode(parseInt(p1, 16));
  }));
};

/**
 * Base64 디코딩 (UTF-8 지원)
 */
const decode = (str: string): any => {
  try {
    // Base64를 UTF-8 문자열로 디코딩 (한글 지원)
    const decoded = atob(str);
    const utf8String = decodeURIComponent(
      decoded.split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join('')
    );
    return JSON.parse(utf8String);
  } catch {
    return null;
  }
};

/**
 * Mock JWT 토큰 생성
 * 실제로는 서버에서 비밀키로 서명된 JWT를 생성해야 합니다.
 */
export const generateMockToken = (userId: string, email: string, role: UserRole): string => {
  const payload: JWTPayload = {
    userId,
    email,
    role,
    iat: Date.now(),
    exp: Date.now() + (24 * 60 * 60 * 1000), // 24시간 후 만료
  };

  // 실제 JWT 형식: header.payload.signature
  // 여기서는 교육용으로 간단하게 구현
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const encodedPayload = encode(payload);
  const signature = encode({ mock: 'signature' });

  return `${header}.${encodedPayload}.${signature}`;
};

/**
 * Mock JWT 토큰 검증 및 디코딩
 */
export const verifyMockToken = (token: string): JWTPayload | null => {
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = decode(parts[1]) as JWTPayload;

    // 만료 시간 확인
    if (payload.exp < Date.now()) {
      console.warn('토큰이 만료되었습니다.');
      return null;
    }

    return payload;
  } catch (error) {
    console.error('토큰 검증 실패:', error);
    return null;
  }
};

/**
 * Authorization 헤더에서 토큰 추출
 */
export const extractTokenFromHeader = (authHeader: string | null): string | null => {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

/**
 * 권한 체크 헬퍼
 */
export const hasPermission = (userRole: UserRole, requiredRoles: UserRole[]): boolean => {
  return requiredRoles.includes(userRole);
};
