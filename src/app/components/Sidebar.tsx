import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Star,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { ROLES } from '../../constants/roles';
import type { UserRole } from '../../types';

interface MenuItem {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
  roles: UserRole[];
}

const allMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: '대시보드', path: '/dashboard', roles: [ROLES.SUPER_ADMIN, ROLES.OPERATION_ADMIN, ROLES.CS_ADMIN] },
  { icon: Users, label: '관리자 관리', path: '/users', roles: [ROLES.SUPER_ADMIN] },
  { icon: Users, label: '고객 관리', path: '/customers', roles: [ROLES.SUPER_ADMIN, ROLES.OPERATION_ADMIN, ROLES.CS_ADMIN] },
  { icon: Package, label: '상품 관리', path: '/products', roles: [ROLES.SUPER_ADMIN, ROLES.OPERATION_ADMIN] },
  { icon: ShoppingCart, label: '주문 관리', path: '/orders', roles: [ROLES.SUPER_ADMIN, ROLES.OPERATION_ADMIN, ROLES.CS_ADMIN] },
  { icon: Star, label: '리뷰 관리', path: '/reviews', roles: [ROLES.SUPER_ADMIN, ROLES.OPERATION_ADMIN, ROLES.CS_ADMIN] },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const isSidebarOpen = useThemeStore((state) => state.isSidebarOpen);
  const toggleSidebar = useThemeStore((state) => state.toggleSidebar);

  // 역할별 메뉴 필터링
  const menuItems = useMemo(() => {
    if (!user) return [];
    return allMenuItems.filter(item => item.roles.includes(user.role));
  }, [user]);

  return (
    <aside className={`${
      isSidebarOpen ? 'w-56' : 'w-16'
    } bg-white dark:bg-gray-800 border-r dark:border-gray-700 h-screen sticky top-0 shadow-sm transition-all duration-300`}>
      <div className={`h-[73px] border-b dark:border-gray-700 bg-gradient-to-r from-[#4B6CB7] to-[#3d5a99] flex items-center transition-all duration-300 ${
        isSidebarOpen ? 'px-4 justify-between' : 'px-3 justify-center'
      }`}>
        {isSidebarOpen ? (
          <>
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                <LayoutDashboard className="text-white" size={20} />
              </div>
              <h1 className="text-white font-bold text-sm">관리자 대시보드</h1>
            </div>
            <button
              onClick={toggleSidebar}
              className="text-white hover:bg-white/20 p-1.5 rounded-lg transition-all flex-shrink-0"
              aria-label="사이드바 닫기"
            >
              <ChevronLeft size={18} />
            </button>
          </>
        ) : (
          <button
            onClick={toggleSidebar}
            className="w-full h-full flex flex-col items-center justify-center gap-1 group"
            aria-label="사이드바 열기"
          >
            <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-all">
              <LayoutDashboard className="text-white" size={20} />
            </div>
            <ChevronRight size={14} className="text-white/80 group-hover:text-white transition-all" />
          </button>
        )}
      </div>
      <nav className={`${isSidebarOpen ? 'p-3' : 'p-2'} transition-all duration-300`}>
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path} className="relative">
                {isActive && isSidebarOpen && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#4B6CB7] to-[#3d5a99] rounded-r-full" />
                )}
                <Link
                  to={item.path}
                  className={`flex items-center ${isSidebarOpen ? 'gap-2.5 px-3' : 'justify-center px-1'} py-2.5 rounded-lg transition-all duration-200 ${
                    isActive
                      ? `bg-gradient-to-r from-[#4B6CB7]/10 to-[#4B6CB7]/5 text-[#4B6CB7] dark:text-[#6B8DD7] font-medium shadow-sm ${isSidebarOpen ? 'ml-2' : ''}`
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                  title={!isSidebarOpen ? item.label : undefined}
                >
                  <div className={`${isActive ? 'bg-[#4B6CB7]/10 dark:bg-[#4B6CB7]/20 p-1.5 rounded-lg' : ''}`}>
                    <Icon size={18} className={isActive ? 'text-[#4B6CB7] dark:text-[#6B8DD7]' : ''} />
                  </div>
                  {isSidebarOpen && <span className="text-sm">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};
