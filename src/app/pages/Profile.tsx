import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { User, Mail, Phone, Lock } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api';
import { toast } from 'sonner';

export const Profile: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const changePassword = useAuthStore((state) => state.changePassword);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // 프로필 정보 조회
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const profileData = await authApi.getProfile();
        setFormData({
          name: profileData.name || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } catch (error) {
        toast.error('프로필 정보를 불러오는데 실패했습니다.');
        // fallback to store user if API fails
        if (user) {
          setFormData({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
        }
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('모든 필드를 입력해주세요.');
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    // 전화번호 형식 검증 (010-XXXX-XXXX)
    const phoneRegex = /^01[0-9]-\d{3,4}-\d{4}$/;
    if (!phoneRegex.test(formData.phone)) {
      toast.error('올바른 전화번호 형식을 입력해주세요. (예: 010-1234-5678)');
      return;
    }

    try {
      await updateProfile({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      });
      toast.success('프로필이 업데이트되었습니다!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '프로필 업데이트에 실패했습니다.');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      toast.error('모든 비밀번호 필드를 입력해주세요.');
      return;
    }

    if (formData.newPassword.length < 8) {
      toast.error('새 비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsChangingPassword(true);

    try {
      await changePassword(formData.currentPassword, formData.newPassword);
      toast.success('비밀번호가 성공적으로 변경되었습니다!');
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '비밀번호 변경에 실패했습니다.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <Layout pageTitle="내 프로필">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <div className="bg-white dark:bg-gray-800 rounded shadow dark:shadow-gray-900/50 p-6">
          <div className="flex items-center gap-3 mb-6">
            <User size={24} className="text-[#4B6CB7] dark:text-[#6B8DD7]" />
            <h3 className="dark:text-gray-200">프로필 정보</h3>
          </div>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="flex items-center gap-2">
              <User size={20} className="text-gray-400 dark:text-gray-500" />
              <Input
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="이름"
                className="flex-1"
                disabled={isLoadingProfile}
              />
            </div>

            <div className="flex items-center gap-2">
              <Mail size={20} className="text-gray-400 dark:text-gray-500" />
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="이메일"
                className="flex-1"
                disabled={isLoadingProfile}
              />
            </div>

            <div className="flex items-center gap-2">
              <Phone size={20} className="text-gray-400 dark:text-gray-500" />
              <Input
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="전화번호"
                className="flex-1"
                disabled={isLoadingProfile}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoadingProfile}>
              {isLoadingProfile ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  로딩 중...
                </div>
              ) : (
                '프로필 업데이트'
              )}
            </Button>
          </form>
        </div>

        {/* Password Change */}
        <div className="bg-white dark:bg-gray-800 rounded shadow dark:shadow-gray-900/50 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Lock size={24} className="text-[#4B6CB7] dark:text-[#6B8DD7]" />
            <h3 className="dark:text-gray-200">비밀번호 변경</h3>
          </div>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <Input
              label="현재 비밀번호"
              name="currentPassword"
              type="password"
              value={formData.currentPassword}
              onChange={handleChange}
              placeholder="현재 비밀번호를 입력하세요"
              required
              disabled={isChangingPassword || isLoadingProfile}
            />

            <div>
              <Input
                label="새 비밀번호"
                name="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="최소 8자 이상"
                required
                disabled={isChangingPassword || isLoadingProfile}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                * 비밀번호는 최소 8자 이상이어야 합니다.
              </p>
            </div>

            <Input
              label="새 비밀번호 확인"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="새 비밀번호를 다시 입력하세요"
              required
              disabled={isChangingPassword || isLoadingProfile}
            />

            <Button type="submit" className="w-full" disabled={isChangingPassword || isLoadingProfile}>
              {isChangingPassword ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  변경 중...
                </div>
              ) : (
                '비밀번호 변경'
              )}
            </Button>
          </form>
        </div>
      </div>
    </Layout>
  );
};
