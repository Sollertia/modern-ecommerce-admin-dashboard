import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from '../components/Layout';
import { DataTable } from '../components/DataTable';
import { Pagination } from '../components/Pagination';
import { Modal } from '../components/Modal';
import { FormModal } from '../components/FormModal';
import { SearchInput, Input, Select } from '../components/Input';
import { Button } from '../components/Button';
import { TableSkeleton } from '../components/Skeleton';
import { ErrorFallback } from '../components/ErrorFallback';
import { CheckCircle, XCircle, AlertTriangle, Eye, Edit2, Shield, Filter, RefreshCw } from 'lucide-react';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { ROLES, ROLE_LABELS, USER_STATUS, USER_STATUS_LABELS } from '../../constants/roles';
import { toast } from 'sonner';
import { ensureDateFormat } from '../../utils/date';
import { usersApi } from '../../api';
import type { Column, User, UserRole, UserStatus } from '../../types';

const columns: Column[] = [
  { key: 'name', label: '이름', sortable: true },
  { key: 'email', label: '이메일', sortable: true },
  { key: 'phone', label: '전화번호', sortable: false },
  { key: 'role', label: '역할', sortable: true },
  { key: 'status', label: '상태', sortable: true },
  { key: 'createdAt', label: '가입일', sortable: true },
  { key: 'approvedAt', label: '승인일', sortable: true },
];

const roleOptions = [
  { value: ROLES.SUPER_ADMIN, label: '슈퍼 관리자' },
  { value: ROLES.OPERATION_ADMIN, label: '운영 관리자' },
  { value: ROLES.CS_ADMIN, label: 'CS 관리자' },
];

const statusOptions = [
  { value: USER_STATUS.ACTIVE, label: '활성' },
  { value: USER_STATUS.INACTIVE, label: '비활성' },
  { value: USER_STATUS.SUSPENDED, label: '정지' },
  { value: USER_STATUS.PENDING, label: '승인대기' },
  { value: USER_STATUS.REJECTED, label: '거부' },
];

export const Users: React.FC = () => {
  const currentUser = useAuthStore((state) => state.user);
  const users = useDataStore((state) => state.users);
  const usersPagination = useDataStore((state) => state.usersPagination);
  const isLoading = useDataStore((state) => state.isLoading);
  const error = useDataStore((state) => state.error);
  const fetchUsers = useDataStore((state) => state.fetchUsers);
  const addUser = useDataStore((state) => state.addUser);
  const updateUser = useDataStore((state) => state.updateUser);
  const updateUserRole = useDataStore((state) => state.updateUserRole);
  const updateUserStatus = useDataStore((state) => state.updateUserStatus);
  const deleteUser = useDataStore((state) => state.deleteUser);
  const approveUser = useDataStore((state) => state.approveUser);
  const rejectUser = useDataStore((state) => state.rejectUser);

  const isSuperAdmin = currentUser?.role === ROLES.SUPER_ADMIN;
  const canEdit = isSuperAdmin;
  const canDelete = isSuperAdmin;
  const canApprove = isSuperAdmin;

  // 로컬 상태 관리
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<User | null>(null);

  // 서버 요청으로 데이터 가져오기
  const loadUsers = useCallback(() => {
    fetchUsers({
      search: searchTerm,
      role: roleFilter || undefined,
      status: statusFilter || undefined,
      page: currentPage,
      limit: 10,
      sortBy: sortBy || undefined,
      sortOrder: sortBy ? sortOrder : undefined,
    });
  }, [fetchUsers, searchTerm, roleFilter, statusFilter, currentPage, sortBy, sortOrder]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // 검색어 변경 시 첫 페이지로
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // 필터 변경 핸들러
  const handleRoleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  // 필터 초기화
  const handleResetFilters = () => {
    setSearchTerm('');
    setRoleFilter('');
    setStatusFilter('');
    setCurrentPage(1);
  };

  // 정렬 핸들러
  const handleSort = (newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setCurrentPage(1);
  };

  // 모달 관리
  const openDeleteModal = (item: User) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setSelectedItem(null);
    setIsDeleteModalOpen(false);
  };

  const totalPages = usersPagination?.totalPages || 1;

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [roleChangingUser, setRoleChangingUser] = useState<User | null>(null);
  const [statusChangingUser, setStatusChangingUser] = useState<User | null>(null);
  const [approvingUser, setApprovingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [roleFormData, setRoleFormData] = useState<UserRole>(ROLES.OPERATION_ADMIN);
  const [statusFormData, setStatusFormData] = useState<UserStatus>(USER_STATUS.ACTIVE);

  const handleOpenEditModal = (user: User) => {
    if (!canEdit) {
      toast.error('권한이 없습니다.');
      return;
    }
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
    });
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setEditingUser(null);
  };

  const handleOpenRoleModal = (user: User) => {
    if (!isSuperAdmin) {
      toast.error('역할 변경은 슈퍼 관리자만 가능합니다.');
      return;
    }
    setRoleChangingUser(user);
    setRoleFormData(user.role);
    setIsRoleModalOpen(true);
  };

  const handleCloseRoleModal = () => {
    setIsRoleModalOpen(false);
    setRoleChangingUser(null);
  };

  const handleOpenStatusModal = (user: User) => {
    if (!isSuperAdmin) {
      toast.error('상태 변경은 슈퍼 관리자만 가능합니다.');
      return;
    }
    setStatusChangingUser(user);
    setStatusFormData(user.status);
    setIsStatusModalOpen(true);
  };

  const handleCloseStatusModal = () => {
    setIsStatusModalOpen(false);
    setStatusChangingUser(null);
  };

  const handleOpenApproveModal = (user: User) => {
    if (!canApprove) {
      toast.error('슈퍼 관리자만 승인할 수 있습니다.');
      return;
    }
    setApprovingUser(user);
    setIsApproveModalOpen(true);
  };

  const handleOpenRejectModal = (user: User) => {
    if (!canApprove) {
      toast.error('슈퍼 관리자만 거부할 수 있습니다.');
      return;
    }
    setApprovingUser(user);
    setRejectionReason('');
    setIsRejectModalOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
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
      // PUT 요청 - 기본 정보만 전송 (역할, 상태는 별도 관리)
      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      };

      await updateUser(editingUser!.id, updateData);
      toast.success(`${formData.name} 관리자 정보가 수정되었습니다.`);
      handleCloseFormModal();
    } catch (error) {
      toast.error('관리자 정보 수정에 실패했습니다.');
    }
  };

  const handleRoleSubmit = async () => {
    if (!roleChangingUser) return;

    try {
      await updateUserRole(roleChangingUser.id, roleFormData);
      toast.success(`${roleChangingUser.name} 관리자의 역할이 "${ROLE_LABELS[roleFormData]}"로 변경되었습니다.`);
      handleCloseRoleModal();
    } catch (error) {
      toast.error('역할 변경에 실패했습니다.');
    }
  };

  const handleStatusSubmit = async () => {
    if (!statusChangingUser) return;

    try {
      await updateUserStatus(statusChangingUser.id, statusFormData);
      toast.success(`${statusChangingUser.name} 관리자의 상태가 "${USER_STATUS_LABELS[statusFormData]}"로 변경되었습니다.`);
      handleCloseStatusModal();
    } catch (error) {
      toast.error('상태 변경에 실패했습니다.');
    }
  };

  const handleApprove = async () => {
    if (!approvingUser || !currentUser) return;

    try {
      await approveUser(approvingUser.id);
      toast.success(`${approvingUser.name} 관리자가 승인되었습니다.`);
      setIsApproveModalOpen(false);
      setApprovingUser(null);
    } catch (error) {
      toast.error('승인에 실패했습니다.');
    }
  };

  const handleReject = async () => {
    if (!approvingUser || !currentUser) return;
    if (!rejectionReason.trim()) {
      toast.error('거부 사유를 입력해주세요.');
      return;
    }

    try {
      await rejectUser(approvingUser.id, rejectionReason);
      toast.success(`${approvingUser.name} 관리자 등록 요청이 거부되었습니다.`);
      setIsRejectModalOpen(false);
      setApprovingUser(null);
      setRejectionReason('');
    } catch (error) {
      toast.error('거부 처리에 실패했습니다.');
    }
  };

  const confirmDelete = async () => {
    if (!canDelete) {
      toast.error('슈퍼 관리자만 삭제할 수 있습니다.');
      return;
    }

    if (selectedItem) {
      try {
        await deleteUser(selectedItem.id);
        toast.success(`${selectedItem.name} 유저가 삭제되었습니다.`);
        closeDeleteModal();

        // 삭제 성공 후 목록 다시 불러오기
        loadUsers();
      } catch (error) {
        toast.error('유저 삭제에 실패했습니다.');
      }
    }
  };

  const handleOpenDetailsModal = async (user: User) => {
    setIsDetailsModalOpen(true);
    setIsLoadingDetails(true);
    setViewingUser(null);

    try {
      // API로 관리자 상세 정보 조회
      const userDetails = await usersApi.getById(user.id);
      setViewingUser(userDetails);
    } catch (error) {
      toast.error('관리자 정보를 불러오는데 실패했습니다.');
      setIsDetailsModalOpen(false);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setViewingUser(null);
  };

  const renderCustomActions = (user: User) => {
    const actions = [];

    // 상세보기 버튼 (항상 표시)
    actions.push(
      <button
        key="view"
        onClick={() => handleOpenDetailsModal(user)}
        className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 hover:scale-110"
        title="상세보기"
      >
        <Eye size={18} />
      </button>
    );

    // 역할 변경 버튼 (슈퍼 관리자만)
    if (isSuperAdmin) {
      actions.push(
        <button
          key="role"
          onClick={() => handleOpenRoleModal(user)}
          className="p-2 rounded-lg text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-200 hover:scale-110"
          title="역할 변경"
        >
          <Shield size={18} />
        </button>
      );
    }

    // 상태 변경 버튼 (슈퍼 관리자만)
    if (isSuperAdmin) {
      actions.push(
        <button
          key="status"
          onClick={() => handleOpenStatusModal(user)}
          className="p-2 rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200 hover:scale-110"
          title="상태 변경"
        >
          <Edit2 size={18} />
        </button>
      );
    }

    // 승인/거부 버튼 (승인 대기 상태일 때만)
    if (user.status === USER_STATUS.PENDING && canApprove) {
      actions.push(
        <button
          key="approve"
          onClick={() => handleOpenApproveModal(user)}
          className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
          title="승인"
        >
          <CheckCircle size={18} />
        </button>,
        <button
          key="reject"
          onClick={() => handleOpenRejectModal(user)}
          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
          title="거부"
        >
          <XCircle size={18} />
        </button>
      );
    }

    return <div className="flex gap-2">{actions}</div>;
  };

  // 슈퍼 관리자만 관리자 관리 페이지 접근 가능
  if (!isSuperAdmin) {
    return (
      <Layout pageTitle="관리자 관리">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              접근 권한이 없습니다
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              관리자 관리는 슈퍼 관리자만 접근할 수 있습니다.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              현재 역할: <span className="font-semibold">{currentUser?.role ? ROLE_LABELS[currentUser.role] : '-'}</span>
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout pageTitle="관리자 관리">
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded shadow dark:shadow-gray-900/50 p-6">
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 max-w-md">
              <SearchInput
                placeholder="이름 또는 이메일로 검색..."
                onSearch={handleSearch}
                className="w-full"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center px-2 text-gray-500 dark:text-gray-400">
                  <Filter size={16} />
                  <span className="text-xs font-medium ml-1">필터</span>
                </div>
                <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
                <select
                  value={roleFilter}
                  onChange={handleRoleFilterChange}
                  className="bg-transparent text-sm border-none focus:ring-0 text-gray-700 dark:text-gray-200 py-1 pl-2 pr-8 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                >
                  <option value="">모든 역할</option>
                  {roleOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
                <select
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  className="bg-transparent text-sm border-none focus:ring-0 text-gray-700 dark:text-gray-200 py-1 pl-2 pr-8 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                >
                  <option value="">모든 상태</option>
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {(roleFilter || statusFilter || searchTerm) && (
                <Button
                  onClick={handleResetFilters}
                  variant="secondary"
                  className="flex items-center gap-1.5 px-3 py-1.5 h-[38px] text-xs"
                  title="필터 초기화"
                >
                  <RefreshCw size={14} />
                  초기화
                </Button>
              )}
            </div>
          </div>

          {isLoading ? (
            <TableSkeleton rows={10} />
          ) : error ? (
            <ErrorFallback
              error={error}
              onRetry={loadUsers}
              title="사용자 목록을 불러올 수 없습니다"
              message="사용자 데이터를 불러오는 중 문제가 발생했습니다. 다시 시도해주세요."
            />
          ) : (
            <>
              <DataTable
                columns={columns}
                data={users}
                onEdit={canEdit ? handleOpenEditModal : undefined}
                onDelete={canDelete ? openDeleteModal : undefined}
                renderCustomActions={renderCustomActions}
                selectable
                onSort={handleSort}
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                renderCell={(item, columnKey) => {
                  if (columnKey === 'createdAt' || columnKey === 'approvedAt' || columnKey === 'lastLoginAt' || columnKey === 'rejectedAt') {
                    return ensureDateFormat(item[columnKey]);
                  }
                  if (columnKey === 'role') {
                    return (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.role === ROLES.SUPER_ADMIN 
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                          : item.role === ROLES.OPERATION_ADMIN
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      }`}>
                        {ROLE_LABELS[item.role as string] || item.role}
                      </span>
                    );
                  }
                  if (columnKey === 'status') {
                    const statusColors: Record<string, string> = {
                      [USER_STATUS.ACTIVE]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                      [USER_STATUS.INACTIVE]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
                      [USER_STATUS.SUSPENDED]: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                      [USER_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
                      [USER_STATUS.REJECTED]: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                    };
                    return (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[item.status as string] || 'bg-gray-100 text-gray-800'}`}>
                        {USER_STATUS_LABELS[item.status as string] || item.status}
                      </span>
                    );
                  }
                  return item[columnKey];
                }}
              />

              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 편집 모달 */}
      <FormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        title="관리자 정보 수정"
        onSubmit={handleSubmit}
        submitText="수정"
      >
        <Input
          label="이름"
          name="name"
          value={formData.name}
          onChange={handleFormChange}
          placeholder="홍길동"
          required
        />
        <Input
          label="이메일"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleFormChange}
          placeholder="user@example.com"
          required
        />
        <Input
          label="전화번호"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleFormChange}
          placeholder="010-1234-5678"
          required
        />
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
            💡 이름, 이메일, 전화번호만 수정 가능합니다.
          </p>
          <p className="text-xs text-blue-500 dark:text-blue-500 mt-1">
            역할 및 상태는 별도 기능(승인/거부/정지 등)으로 관리됩니다.
          </p>
        </div>
      </FormModal>

      {/* 역할 변경 모달 */}
      <FormModal
        isOpen={isRoleModalOpen}
        onClose={handleCloseRoleModal}
        title="관리자 역할 변경"
        onSubmit={handleRoleSubmit}
        submitText="변경"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">관리자명</p>
            <p className="font-semibold dark:text-gray-200">{roleChangingUser?.name}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">현재 역할</p>
            <p className="font-semibold dark:text-gray-200">
              {roleChangingUser?.role ? ROLE_LABELS[roleChangingUser.role] : '-'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              변경할 역할 <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <Select
              name="role"
              value={roleFormData}
              onChange={(e) => setRoleFormData(e.target.value as UserRole)}
              options={roleOptions}
            />
          </div>
          <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-800">
            <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
              💡 관리자 역할 설명
            </p>
            <ul className="text-xs text-orange-500 dark:text-orange-500 mt-1 space-y-1">
              <li>• 슈퍼 관리자: 모든 권한 보유</li>
              <li>• 운영 관리자: 상품 및 주문 관리 권한</li>
              <li>• CS 관리자: 고객 및 리뷰 관리 권한</li>
            </ul>
          </div>
        </div>
      </FormModal>

      {/* 상태 변경 모달 */}
      <FormModal
        isOpen={isStatusModalOpen}
        onClose={handleCloseStatusModal}
        title="관리자 상태 변경"
        onSubmit={handleStatusSubmit}
        submitText="변경"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">관리자명</p>
            <p className="font-semibold dark:text-gray-200">{statusChangingUser?.name}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">현재 상태</p>
            <p className="font-semibold dark:text-gray-200">
              {statusChangingUser?.status ? USER_STATUS_LABELS[statusChangingUser.status] : '-'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              변경할 상태 <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <Select
              name="status"
              value={statusFormData}
              onChange={(e) => setStatusFormData(e.target.value as UserStatus)}
              options={statusOptions}
            />
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-200 dark:border-purple-800">
            <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
              💡 관리자 상태 설명
            </p>
            <ul className="text-xs text-purple-500 dark:text-purple-500 mt-1 space-y-1">
              <li>• 활성: 정상적으로 시스템을 이용할 수 있는 관리자</li>
              <li>• 비활성: 장기간 미이용 등으로 비활성화된 관리자</li>
              <li>• 정지: 규정 위반 등으로 시스템 이용이 제한된 관리자</li>
              <li>• 승인대기: 신규 등록 요청 중인 관리자</li>
              <li>• 거부: 등록 요청이 거부된 관리자</li>
            </ul>
          </div>
        </div>
      </FormModal>

      {/* 승인 모달 */}
      <Modal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        title="관리자 승인"
        onConfirm={handleApprove}
        confirmText="승인"
        cancelText="취소"
        variant="success"
      >
        <p className="dark:text-gray-300">
          <strong>{approvingUser?.name}</strong> 관리자의 등록 요청을 승인하시겠습니까?
        </p>
        {approvingUser?.requestMessage && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">등록 요청 메시지:</p>
            <p className="text-sm dark:text-gray-300">{approvingUser.requestMessage}</p>
          </div>
        )}
      </Modal>

      {/* 거부 모달 */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false);
          setRejectionReason('');
        }}
        title="관리자 등록 거부"
        onConfirm={handleReject}
        confirmText="거부"
        cancelText="취소"
        variant="danger"
      >
        <p className="dark:text-gray-300 mb-4">
          <strong>{approvingUser?.name}</strong> 관리자의 등록 요청을 거부하시겠습니까?
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            거부 사유 (필수)
          </label>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
            rows={4}
            placeholder="거부 사유를 입력하세요"
            required
          />
        </div>
      </Modal>

      {/* 삭제 확인 모달 */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        title="유저 삭제"
        onConfirm={confirmDelete}
        confirmText="삭제"
        cancelText="취소"
        variant="danger"
      >
        <p className="dark:text-gray-300">정말로 <strong>{selectedItem?.name}</strong> 유저를 삭제하시겠습니까?</p>
        <p className="text-gray-600 dark:text-gray-400 mt-2">이 작업은 되돌릴 수 없습니다.</p>
      </Modal>

      {/* 관리자 상세 정보 모달 */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        title="관리자 상세 정보"
        confirmText="확인"
        onConfirm={handleCloseDetailsModal}
      >
        {isLoadingDetails ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">관리자 정보를 불러오는 중...</p>
          </div>
        ) : viewingUser && (
          <div className="space-y-6">
            {/* 기본 정보 */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">기본 정보</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">이름</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{viewingUser.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">이메일</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 break-all">{viewingUser.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">전화번호</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{viewingUser.phone || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 권한 및 상태 */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">권한 및 상태</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">역할</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{ROLE_LABELS[viewingUser.role]}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">상태</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                    viewingUser.status === USER_STATUS.ACTIVE
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : viewingUser.status === USER_STATUS.PENDING
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                      : viewingUser.status === USER_STATUS.REJECTED
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {USER_STATUS_LABELS[viewingUser.status]}
                  </span>
                </div>
              </div>
            </div>

            {/* 가입 정보 */}
            <div className="pb-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">가입 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">가입일</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{ensureDateFormat(viewingUser.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">승인일</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{viewingUser.approvedAt ? ensureDateFormat(viewingUser.approvedAt) : '-'}</p>
                </div>
              </div>
            </div>

            {/* 신청 메시지 */}
            {viewingUser.requestMessage && (
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-400 mb-2">신청 메시지</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">{viewingUser.requestMessage}</p>
              </div>
            )}

            {/* 거부 사유 */}
            {viewingUser.status === USER_STATUS.REJECTED && viewingUser.rejectionReason && (
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-red-900 dark:text-red-400 mb-2">거부 사유</h3>
                <p className="text-sm text-red-700 dark:text-red-300">{viewingUser.rejectionReason}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </Layout>
  );
};
