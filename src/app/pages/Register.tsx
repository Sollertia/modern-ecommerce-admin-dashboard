import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input, Select } from '../components/Input';
import { Button } from '../components/Button';
import { UserPlus } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { ROLES } from '../../constants/roles';
import { toast } from 'sonner';
import type { RegisterData } from '../../types';

const roleOptions = [
  { value: ROLES.SUPER_ADMIN, label: '슈퍼 관리자' },
  { value: ROLES.OPERATION_ADMIN, label: '운영 관리자' },
  { value: ROLES.CS_ADMIN, label: 'CS 관리자' },
];

export const Register: React.FC = () => {
  const [formData, setFormData] = useState<RegisterData>({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: ROLES.OPERATION_ADMIN,
  });
  const [requestMessage, setRequestMessage] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 유효성 검사
    if (!formData.name || !formData.email || !formData.password || !formData.phone) {
      const errorMsg = '모든 필드를 입력해주세요.';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      const errorMsg = '올바른 이메일 형식을 입력해주세요.';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    // 전화번호 형식 검증 (010-XXXX-XXXX)
    const phoneRegex = /^01[0-9]-\d{3,4}-\d{4}$/;
    if (!phoneRegex.test(formData.phone)) {
      const errorMsg = '올바른 전화번호 형식을 입력해주세요. (예: 010-1234-5678)';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (!requestMessage.trim()) {
      const errorMsg = '지원 사유를 입력해주세요.';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (formData.password !== confirmPassword) {
      const errorMsg = '비밀번호가 일치하지 않습니다.';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (formData.password.length < 8) {
      const errorMsg = '비밀번호는 최소 8자 이상이어야 합니다.';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setIsLoading(true);

    try {
      await register({ ...formData, requestMessage });
      toast.success('관리자 계정 신청이 완료되었습니다! 승인 후 로그인이 가능합니다.');
      navigate('/login');
    } catch (err) {
      const errorMsg = '회원가입에 실패했습니다. 다시 시도해주세요.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4B6CB7] via-[#3d5a99] to-[#2d4373] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl dark:shadow-gray-900/50 p-8 w-full max-w-md relative z-10 backdrop-blur-sm border border-white/20 dark:border-gray-700/50">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#4B6CB7] to-[#3d5a99] dark:from-[#6B8DD7] dark:to-[#5a7cc7] rounded-2xl flex items-center justify-center text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
            <UserPlus size={28} />
          </div>
        </div>
        <h2 className="text-center mb-2 bg-gradient-to-r from-[#4B6CB7] to-[#3d5a99] dark:from-[#6B8DD7] dark:to-[#5a7cc7] bg-clip-text text-transparent">회원가입</h2>
        <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-6">새로운 계정을 만들어보세요</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg animate-in fade-in slide-in-from-top-2 duration-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="이름"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            placeholder="홍길동"
            required
            disabled={isLoading}
          />

          <Input
            label="이메일"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="user@example.com"
            required
            disabled={isLoading}
          />

          <Input
            label="전화번호"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="010-1234-5678"
            required
            disabled={isLoading}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              신청 역할 <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <Select
              name="role"
              value={formData.role}
              onChange={handleChange}
              options={roleOptions}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              지원 사유 <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <textarea
              name="requestMessage"
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4B6CB7] dark:focus:ring-[#6B8DD7] focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed transition-colors duration-200"
              rows={3}
              placeholder="해당 역할을 신청하는 이유를 입력해주세요 (경력, 담당 업무 등)"
              required
              disabled={isLoading}
            />
          </div>

          <Input
            label="비밀번호"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="최소 8자 이상"
            required
            disabled={isLoading}
          />

          <Input
            label="비밀번호 확인"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="비밀번호를 다시 입력하세요"
            required
            disabled={isLoading}
          />

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#4B6CB7] to-[#3d5a99] hover:from-[#3d5a99] hover:to-[#2d4373] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                가입 중...
              </div>
            ) : (
              '회원가입'
            )}
          </Button>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              이미 계정이 있으신가요?{' '}
              <Link
                to="/login"
                className="text-[#4B6CB7] dark:text-[#6B8DD7] hover:text-[#3d5a99] dark:hover:text-[#5a7cc7] font-medium transition-colors duration-200 hover:underline"
              >
                로그인
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
