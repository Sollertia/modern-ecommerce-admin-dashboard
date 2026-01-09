import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { LogIn } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ email, password });
      toast.success('로그인 성공!');
      navigate('/dashboard');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '로그인에 실패했습니다. 다시 시도해주세요.';
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
            <LogIn size={28} />
          </div>
        </div>
        <h2 className="text-center mb-2 bg-gradient-to-r from-[#4B6CB7] to-[#3d5a99] dark:from-[#6B8DD7] dark:to-[#5a7cc7] bg-clip-text text-transparent">관리자 로그인</h2>
        <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-6">대시보드에 접속하려면 로그인하세요</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg animate-in fade-in slide-in-from-top-2 duration-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="이메일"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            required
            disabled={isLoading}
          />

          <Input
            label="비밀번호"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호를 입력하세요"
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
                로그인 중...
              </div>
            ) : (
              '로그인'
            )}
          </Button>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              계정이 없으신가요?{' '}
              <Link
                to="/register"
                className="text-[#4B6CB7] dark:text-[#6B8DD7] hover:text-[#3d5a99] dark:hover:text-[#5a7cc7] font-medium transition-colors duration-200 hover:underline"
              >
                회원가입
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
