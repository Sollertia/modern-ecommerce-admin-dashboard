import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser, LoginCredentials, RegisterData } from '../types';
import { authApi } from '../api';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { name: string; email: string; phone: string }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (credentials: LoginCredentials) => {
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
          });

          // 응답이 비어있는지 확인
          const text = await response.text();
          if (!text) {
            throw new Error('서버로부터 응답을 받지 못했습니다. MSW가 실행 중인지 확인하세요.');
          }

          const result = JSON.parse(text);

          if (!result.success) {
            throw new Error(result.message || '로그인에 실패했습니다.');
          }

          set({
            user: result.data.user,
            token: result.data.token,
            isAuthenticated: true,
          });
        } catch (error) {
          console.error('Login error:', error);
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });

          const result = await response.json();

          if (!result.success) {
            throw new Error(result.message || '회원가입에 실패했습니다.');
          }

          // 회원가입 후에는 토큰 없음 (승인 후 로그인 필요)
          set({
            user: result.data,
            token: null,
            isAuthenticated: false,
          });
        } catch (error) {
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      updateProfile: async (data: { name: string; email: string; phone: string }) => {
        try {
          const response = await authApi.updateProfile(data);
          set((state) => ({
            user: state.user ? { ...state.user, ...response } : null,
          }));
        } catch (error) {
          throw error;
        }
      },

      changePassword: async (currentPassword: string, newPassword: string) => {
        try {
          await authApi.changePassword(currentPassword, newPassword);
          set((state) => ({
            user: state.user ? { ...state.user, password: newPassword } : null,
          }));
        } catch (error) {
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage', // localStorage key
    }
  )
);
