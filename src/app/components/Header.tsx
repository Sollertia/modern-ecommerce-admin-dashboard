import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Settings, Moon, Sun } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

interface HeaderProps {
  pageTitle: string;
}

export const Header: React.FC<HeaderProps> = ({ pageTitle }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { isDarkMode, toggleTheme } = useThemeStore();

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfile = () => {
    navigate('/profile');
    setIsDropdownOpen(false);
  };

  return (
    <header className="h-[73px] bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 shadow-sm transition-colors duration-200 flex items-center">
      <div className="flex items-center justify-between w-full">
        <h2 className="bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-200 dark:to-gray-400 bg-clip-text text-transparent font-semibold text-xl">{pageTitle}</h2>
        <div className="flex items-center gap-3">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 group"
            title={isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
          >
            {isDarkMode ? (
              <Sun size={20} className="text-gray-400 group-hover:text-yellow-500 transition-colors" />
            ) : (
              <Moon size={20} className="text-gray-600 dark:text-gray-400 group-hover:text-[#4B6CB7] transition-colors" />
            )}
          </button>

          <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-sm"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-[#4B6CB7] to-[#3d5a99] rounded-full flex items-center justify-center text-white shadow-md">
              <User size={18} />
            </div>
            <span className="text-gray-700 dark:text-gray-200 font-medium">{user?.name || '관리자'}</span>
            <svg
              className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <button
                onClick={handleProfile}
                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 group"
              >
                <Settings size={18} className="text-gray-500 dark:text-gray-400 group-hover:text-[#4B6CB7] dark:group-hover:text-[#6B8DD7] transition-colors" />
                <span className="text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white">내 프로필</span>
              </button>
              <div className="h-px bg-gray-100 dark:bg-gray-700"></div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150 text-red-600 dark:text-red-400 group"
              >
                <LogOut size={18} className="group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors" />
                <span className="group-hover:text-red-700 dark:group-hover:text-red-300">로그아웃</span>
              </button>
            </div>
          )}
          </div>
        </div>
      </div>
    </header>
  );
};
