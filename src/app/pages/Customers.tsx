import React, {useCallback, useEffect, useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import {Layout} from '../components/Layout';
import {DataTable} from '../components/DataTable';
import {Pagination} from '../components/Pagination';
import {Modal} from '../components/Modal';
import {FormModal} from '../components/FormModal';
import {Input, SearchInput, Select} from '../components/Input';
import {TableSkeleton} from '../components/Skeleton';
import {ErrorFallback} from '../components/ErrorFallback';
import {AlertTriangle, Edit2, Eye} from 'lucide-react';
import {useDataStore} from '../../store/dataStore';
import {useAuthStore} from '../../store/authStore';
import {CUSTOMER_STATUS, CUSTOMER_STATUS_LABELS, ROLE_LABELS, ROLES} from '../../constants/roles';
import {toast} from 'sonner';
import {ensureDateFormat} from '../../utils/date';
import {customersApi} from '../../api';
import type {Column, Customer, CustomerStatus} from '../../types';

const columns: Column[] = [
  { key: 'name', label: '이름', sortable: true },
  { key: 'email', label: '이메일', sortable: true },
  { key: 'phone', label: '전화번호', sortable: false },
  { key: 'status', label: '상태', sortable: true },
  { key: 'totalOrders', label: '총 주문', sortable: true },
  { key: 'totalSpent', label: '총 구매액', sortable: true },
  { key: 'createdAt', label: '가입일', sortable: true },
];

const statusOptions = [
  { value: CUSTOMER_STATUS.ACTIVE, label: '활성' },
  { value: CUSTOMER_STATUS.INACTIVE, label: '비활성' },
  { value: CUSTOMER_STATUS.SUSPENDED, label: '정지' },
];

export const Customers: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightedCustomerId = searchParams.get('customerId');

  const currentUser = useAuthStore((state) => state.user);
  const customers = useDataStore((state) => state.customers);
  const customersPagination = useDataStore((state) => state.customersPagination);
  const isLoading = useDataStore((state) => state.isLoading);
  const error = useDataStore((state) => state.error);
  const fetchCustomers = useDataStore((state) => state.fetchCustomers);
  const addCustomer = useDataStore((state) => state.addCustomer);
  const updateCustomer = useDataStore((state) => state.updateCustomer);
  const updateCustomerStatus = useDataStore((state) => state.updateCustomerStatus);
  const deleteCustomer = useDataStore((state) => state.deleteCustomer);

  const isSuperAdmin = currentUser?.role === ROLES.SUPER_ADMIN;
  const isOperationAdmin = currentUser?.role === ROLES.OPERATION_ADMIN;
  const isCSAdmin = currentUser?.role === ROLES.CS_ADMIN;
  const canEdit = isSuperAdmin || isOperationAdmin || isCSAdmin;
  const canDelete = isSuperAdmin;

  // 로컬 상태 관리
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Customer | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);

  // 서버 요청으로 데이터 가져오기
  const loadCustomers = useCallback(() => {
    fetchCustomers({
      search: searchTerm,
      page: currentPage,
      limit: 10,
      sortBy: sortBy || undefined,
      sortOrder: sortBy ? sortOrder : undefined,
    });
  }, [fetchCustomers, searchTerm, currentPage, sortBy, sortOrder]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // 검색어 변경 시 첫 페이지로
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // 정렬 핸들러
  const handleSort = (newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setCurrentPage(1);
  };

  // 모달 관리
  const openDeleteModal = (item: Customer) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setSelectedItem(null);
    setIsDeleteModalOpen(false);
  };

  const totalPages = customersPagination?.totalPages || 1;

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [statusChangingCustomer, setStatusChangingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [statusFormData, setStatusFormData] = useState<CustomerStatus>(CUSTOMER_STATUS.ACTIVE);

  const handleOpenEditModal = (customer: Customer) => {
    if (!canEdit) {
      toast.error('권한이 없습니다.');
      return;
    }
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    });
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setEditingCustomer(null);
  };

  const handleOpenStatusModal = (customer: Customer) => {
    if (!canEdit) {
      toast.error('권한이 없습니다.');
      return;
    }
    setStatusChangingCustomer(customer);
    setStatusFormData(customer.status);
    setIsStatusModalOpen(true);
  };

  const handleCloseStatusModal = () => {
    setIsStatusModalOpen(false);
    setStatusChangingCustomer(null);
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
      // PUT 요청 - 기본 정보만 전송 (상태는 별도 API로 관리)
      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      };

      await updateCustomer(editingCustomer!.id, updateData);
      toast.success(`${formData.name} 고객 정보가 수정되었습니다.`);
      handleCloseFormModal();
    } catch (error) {
      toast.error('고객 정보 수정에 실패했습니다.');
    }
  };

  const handleStatusSubmit = async () => {
    if (!statusChangingCustomer) return;

    try {
      // PATCH 요청 - 상태만 전송
      await updateCustomerStatus(statusChangingCustomer.id, statusFormData);
      toast.success(`${statusChangingCustomer.name} 고객의 상태가 "${CUSTOMER_STATUS_LABELS[statusFormData]}"로 변경되었습니다.`);
      handleCloseStatusModal();
    } catch (error) {
      toast.error('고객 상태 변경에 실패했습니다.');
    }
  };

  const handleOpenDetailsModal = async (customer: Customer) => {
    setIsDetailsModalOpen(true);
    setIsLoadingDetails(true);
    setViewingCustomer(null);

    try {
      const details = await customersApi.getById(customer.id);
      setViewingCustomer(details);
    } catch (error) {
      toast.error('정보를 불러오는데 실패했습니다.');
      setIsDetailsModalOpen(false);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setViewingCustomer(null);
  };

  const confirmDelete = async () => {
    if (!canDelete) {
      toast.error('삭제 권한이 없습니다.');
      return;
    }

    if (selectedItem) {
      try {
        await deleteCustomer(selectedItem.id);
        toast.success(`${selectedItem.name} 고객이 삭제되었습니다.`);
        closeDeleteModal();

        // 삭제 성공 후 목록 다시 불러오기
        loadCustomers();
      } catch (error: any) {
        // 에러 메시지 표시
        const errorMessage = error?.message || '고객 삭제에 실패했습니다.';
        toast.error(errorMessage);

        // 모달 닫기
        closeDeleteModal();
      }
    }
  };

  // 권한 체크
  if (!isSuperAdmin && !isOperationAdmin && !isCSAdmin) {
    return (
      <Layout pageTitle="고객 관리">
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
              고객 관리는 슈퍼 관리자, 운영 관리자, CS 관리자만 접근할 수 있습니다.
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
    <Layout pageTitle="고객 관리">
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
          </div>

          {isLoading ? (
            <TableSkeleton rows={10} />
          ) : error ? (
            <ErrorFallback
              error={error}
              onRetry={loadCustomers}
              title="고객 목록을 불러올 수 없습니다"
              message="고객 데이터를 불러오는 중 문제가 발생했습니다. 다시 시도해주세요."
            />
          ) : (
            <>
              <DataTable
                columns={columns}
                data={customers}
                onEdit={canEdit ? handleOpenEditModal : undefined}
                onDelete={canDelete ? openDeleteModal : undefined}
                selectable
                highlightRowId={highlightedCustomerId || undefined}
                onSort={handleSort}
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                renderCell={(item, columnKey) => {
                  if (columnKey === 'createdAt') {
                    return ensureDateFormat(item[columnKey]);
                  }
                  if (columnKey === 'status') {
                    const statusColors: Record<string, string> = {
                      [CUSTOMER_STATUS.ACTIVE]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                      [CUSTOMER_STATUS.INACTIVE]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
                      [CUSTOMER_STATUS.SUSPENDED]: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                    };
                    return (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[item.status as string] || 'bg-gray-100 text-gray-800'}`}>
                        {CUSTOMER_STATUS_LABELS[item.status as string] || item.status}
                      </span>
                    );
                  }
                  return item[columnKey];
                }}
                renderCustomActions={(item) => (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenDetailsModal(item)}
                      className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 hover:scale-110"
                      title="상세보기"
                    >
                      <Eye size={18} />
                    </button>
                    {canEdit && (
                      <button
                        onClick={() => handleOpenStatusModal(item)}
                        className="p-2 rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200 hover:scale-110"
                        title="상태 변경"
                      >
                        <Edit2 size={18} />
                      </button>
                    )}
                  </div>
                )}
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
        title="고객 정보 수정"
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
            💡 고객 상태는 별도의 "상태 변경" 버튼으로 수정할 수 있습니다.
          </p>
        </div>
      </FormModal>

      {/* 고객 상태 변경 모달 */}
      <FormModal
        isOpen={isStatusModalOpen}
        onClose={handleCloseStatusModal}
        title="고객 상태 변경"
        onSubmit={handleStatusSubmit}
        submitText="변경"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">고객명</p>
            <p className="font-semibold dark:text-gray-200">{statusChangingCustomer?.name}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">현재 상태</p>
            <p className="font-semibold dark:text-gray-200">
              {statusChangingCustomer?.status ? CUSTOMER_STATUS_LABELS[statusChangingCustomer.status] : '-'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              변경할 상태 <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <Select
              name="status"
              value={statusFormData}
              onChange={(e) => setStatusFormData(e.target.value as CustomerStatus)}
              options={statusOptions}
            />
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              💡 고객 상태 설명
            </p>
            <ul className="text-xs text-blue-500 dark:text-blue-500 mt-1 space-y-1">
              <li>• 활성: 정상적으로 서비스를 이용할 수 있는 고객</li>
              <li>• 비활성: 장기간 미이용 등으로 비활성화된 고객</li>
              <li>• 정지: 규정 위반 등으로 서비스 이용이 제한된 고객</li>
            </ul>
          </div>
        </div>
      </FormModal>

      {/* 삭제 확인 모달 */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        title="고객 삭제"
        onConfirm={confirmDelete}
        confirmText="삭제"
        cancelText="취소"
        variant="danger"
      >
        <p className="dark:text-gray-300">정말로 <strong>{selectedItem?.name}</strong> 고객을 삭제하시겠습니까?</p>
        <p className="text-gray-600 dark:text-gray-400 mt-2">이 작업은 되돌릴 수 없습니다.</p>
      </Modal>

      {/* 고객 상세 정보 모달 */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        title="고객 상세 정보"
        confirmText="확인"
        onConfirm={handleCloseDetailsModal}
      >
        {isLoadingDetails ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">고객 정보를 불러오는 중...</p>
          </div>
        ) : viewingCustomer && (
          <div className="space-y-6">
            {/* 기본 정보 */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">기본 정보</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">이름</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{viewingCustomer.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">이메일</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 break-all">{viewingCustomer.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">전화번호</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{viewingCustomer.phone || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 고객 상태 */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">고객 상태</h3>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">상태</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                  viewingCustomer.status === CUSTOMER_STATUS.ACTIVE
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : viewingCustomer.status === CUSTOMER_STATUS.SUSPENDED
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  {CUSTOMER_STATUS_LABELS[viewingCustomer.status]}
                </span>
              </div>
            </div>

            {/* 구매 통계 */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">구매 통계</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">총 주문 수</p>
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{viewingCustomer.totalOrders || 0}건</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">총 구매액</p>
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{viewingCustomer.totalSpent || '0원'}</p>
                </div>
              </div>
            </div>

            {/* 가입 정보 */}
            <div className="pb-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">가입 정보</h3>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">가입일</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{ensureDateFormat(viewingCustomer.createdAt)}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};
