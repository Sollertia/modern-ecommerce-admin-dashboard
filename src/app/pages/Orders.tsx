import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { DataTable } from '../components/DataTable';
import { Pagination } from '../components/Pagination';
import { Modal } from '../components/Modal';
import { FormModal } from '../components/FormModal';
import { SearchInput, Select, Input } from '../components/Input';
import { Button } from '../components/Button';
import { TableSkeleton } from '../components/Skeleton';
import { ErrorFallback } from '../components/ErrorFallback';
import { Eye, Plus, Edit2, Trash2, Filter, RefreshCw } from 'lucide-react';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { ROLES, ROLE_LABELS, ORDER_STATUS, ORDER_STATUS_LABELS } from '../../constants/roles';
import { toast } from 'sonner';
import { ensureDateFormat } from '../../utils/date';
import { formatCurrency } from '../../utils/format';
import { ordersApi } from '../../api';
import type { Column, Order, OrderStatus } from '../../types';

const columns: Column[] = [
  { key: 'orderNo', label: '주문번호', sortable: true },
  { key: 'customer', label: '고객명', sortable: true },
  { key: 'product', label: '상품명', sortable: true },
  { key: 'quantity', label: '수량', sortable: true },
  { key: 'amount', label: '금액', sortable: true },
  { key: 'date', label: '주문일', sortable: true },
  { key: 'status', label: '상태', sortable: true },
  { key: 'createdByAdminName', label: '등록 관리자', sortable: false },
];

const statusOptions = [
  { value: 'all', label: '전체 상태' },
  { value: ORDER_STATUS.PREPARING, label: '준비중' },
  { value: ORDER_STATUS.SHIPPING, label: '배송중' },
  { value: ORDER_STATUS.DELIVERED, label: '배송완료' },
  { value: ORDER_STATUS.CANCELLED, label: '취소됨' },
];

const orderStatusOptions = [
  { value: ORDER_STATUS.PREPARING, label: '준비중' },
  { value: ORDER_STATUS.SHIPPING, label: '배송중' },
  { value: ORDER_STATUS.DELIVERED, label: '배송완료' },
];

export const Orders: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightedOrderId = searchParams.get('orderId');

  const currentUser = useAuthStore((state) => state.user);
  const orders = useDataStore((state) => state.orders);
  const ordersPagination = useDataStore((state) => state.ordersPagination);
  const products = useDataStore((state) => state.products);
  const customers = useDataStore((state) => state.customers);
  const isLoading = useDataStore((state) => state.isLoading);
  const error = useDataStore((state) => state.error);
  const fetchOrders = useDataStore((state) => state.fetchOrders);
  const fetchProducts = useDataStore((state) => state.fetchProducts);
  const fetchCustomers = useDataStore((state) => state.fetchCustomers);
  const updateOrderStatus = useDataStore((state) => state.updateOrderStatus);
  const deleteOrder = useDataStore((state) => state.deleteOrder);
  const addOrder = useDataStore((state) => state.addOrder);

  // 권한 체크
  const isSuperAdmin = currentUser?.role === ROLES.SUPER_ADMIN;
  const isOperationAdmin = currentUser?.role === ROLES.OPERATION_ADMIN;
  const isCSAdmin = currentUser?.role === ROLES.CS_ADMIN;
  const canChangeStatus = isSuperAdmin || isOperationAdmin;
  const canCancelOrder = isSuperAdmin || isCSAdmin;
  const canCreateOrder = isSuperAdmin || isCSAdmin;

  // 로컬 상태 관리
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Order | null>(null);

  // 서버 요청으로 데이터 가져오기
  const loadOrders = useCallback(() => {
    fetchOrders({
      search: searchTerm,
      page: currentPage,
      limit: 10,
      status: statusFilter === 'all' ? undefined : statusFilter,
      sortBy: sortBy || undefined,
      sortOrder: sortBy ? sortOrder : undefined,
    });
  }, [fetchOrders, searchTerm, currentPage, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // 검색어 변경 시 첫 페이지로
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // 필터 변경 핸들러
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  // 필터 초기화
  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  // 정렬 핸들러
  const handleSort = (newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setCurrentPage(1);
  };

  // 모달 관리
  const openDeleteModal = (item: Order) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setSelectedItem(null);
    setIsDeleteModalOpen(false);
  };

  const totalPages = ordersPagination?.totalPages || 1;

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [formData, setFormData] = useState<OrderStatus>(ORDER_STATUS.PREPARING);
  const [cancellationReason, setCancellationReason] = useState('');
  const [createFormData, setCreateFormData] = useState<{
    customerId: string;
    customer: string;
    productId: string;
    product: string;
    quantity: string;
    amount: number;
  }>({
    customerId: '',
    customer: '',
    productId: '',
    product: '',
    quantity: '1',
    amount: 0,
  });

  const handleOpenEditModal = (order: Order) => {
    if (!canChangeStatus) {
      toast.error('주문 상태 변경 권한이 없습니다.');
      return;
    }

    // 배송완료된 주문은 상태 변경 불가
    if (order.status === ORDER_STATUS.DELIVERED) {
      toast.error('배송완료된 주문은 상태를 변경할 수 없습니다.');
      return;
    }

    setEditingOrder(order);
    setFormData(order.status);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setEditingOrder(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(e.target.value as OrderStatus);
  };

  const handleSubmit = async () => {
    if (editingOrder) {
      try {
        await updateOrderStatus(editingOrder.id, formData);
        toast.success(`${editingOrder.orderNo} 주문 상태가 "${ORDER_STATUS_LABELS[formData]}"로 변경되었습니다.`);
        handleCloseFormModal();
      } catch (error) {
        toast.error('주문 상태 변경에 실패했습니다.');
      }
    }
  };

  const confirmDelete = async () => {
    if (!canCancelOrder) {
      toast.error('주문 취소 권한이 없습니다.');
      return;
    }

    if (!cancellationReason.trim()) {
      toast.error('취소 사유를 입력해주세요.');
      return;
    }

    if (selectedItem) {
      try {
        // 주문을 CANCELLED 상태로 변경하고 취소 사유 저장
        await updateOrderStatus(selectedItem.id, ORDER_STATUS.CANCELLED, cancellationReason);
        toast.success(`${selectedItem.orderNo} 주문이 취소되었습니다.`);
        closeDeleteModal();
        setCancellationReason('');

        // 주문 목록과 상품 목록 새로고침
        loadOrders();
      } catch (error: any) {
        const errorMessage = error?.message || '주문 취소에 실패했습니다.';
        toast.error(errorMessage);
        // 에러 발생 시 모달 닫기
        closeDeleteModal();
        setCancellationReason('');
        // 에러 상태 초기화를 위해 주문 목록 다시 로드
        setTimeout(() => {
          loadOrders();
        }, 100);
      }
    }
  };


  const handleOpenDetailsModal = async (order: Order) => {
    setIsDetailsModalOpen(true);
    setIsLoadingDetails(true);
    setViewingOrder(null);

    try {
      // API로 주문 상세 정보 조회
      const orderDetails = await ordersApi.getById(order.id);
      setViewingOrder(orderDetails);
    } catch (error) {
      toast.error('주문 정보를 불러오는데 실패했습니다.');
      setIsDetailsModalOpen(false);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setViewingOrder(null);
    setIsLoadingDetails(false);
  };

  const handleOpenCreateModal = () => {
    if (!canCreateOrder) {
      toast.error('주문 생성 권한이 없습니다.');
      return;
    }
    // 주문 생성 시 전체 상품 및 고객 목록 조회 (페이징 없이)
    fetchProducts({ limit: 20 });
    fetchCustomers({ limit: 10 });
    setCreateFormData({
      customerId: '',
      customer: '',
      productId: '',
      product: '',
      quantity: '1',
      amount: '',
    });
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateFormData({
      customerId: '',
      customer: '',
      productId: '',
      product: '',
      quantity: '1',
      amount: 0,
    });
  };

  const handleCreateFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setCreateFormData((prev) => {
      const updated = { ...prev, [name]: value };

      // 고객 선택 시 customerId와 customer 자동 설정
      if (name === 'customerId') {
        const selectedCustomer = customers.find((c) => c.id === value);
        if (selectedCustomer) {
          updated.customer = selectedCustomer.name;
        }
      }

      // 상품 선택 시 productId, product, 금액 자동 설정
      if (name === 'productId') {
        const selectedProduct = products.find((p) => p.id === value);
        if (selectedProduct) {
          updated.product = selectedProduct.name;
          const quantity = parseInt(updated.quantity) || 1;
          updated.amount = selectedProduct.price * quantity;
        }
      }

      // 수량 변경 시 자동으로 총 금액 재계산
      if (name === 'quantity' && updated.productId) {
        const selectedProduct = products.find((p) => p.id === updated.productId);
        if (selectedProduct) {
          const quantity = parseInt(value) || 1;
          updated.amount = selectedProduct.price * quantity;
        }
      }

      return updated;
    });
  };

  const handleCreateSubmit = async () => {
    if (!createFormData.customerId) {
      toast.error('고객을 선택해주세요.');
      return;
    }

    if (!createFormData.productId) {
      toast.error('상품을 선택해주세요.');
      return;
    }

    // 선택한 상품의 재고 확인
    const selectedProduct = products.find(p => p.id === createFormData.productId);
    if (!selectedProduct) {
      toast.error('선택한 상품을 찾을 수 없습니다.');
      return;
    }

    if (selectedProduct.stock === 0) {
      toast.error('선택한 상품은 품절 상태입니다. 다른 상품을 선택해주세요.');
      return;
    }

    if (!createFormData.quantity || parseInt(createFormData.quantity) < 1) {
      toast.error('수량은 1개 이상이어야 합니다.');
      return;
    }

    const requestedQuantity = parseInt(createFormData.quantity);
    if (requestedQuantity > selectedProduct.stock) {
      toast.error(`재고가 부족합니다. 현재 재고: ${selectedProduct.stock}개, 요청 수량: ${requestedQuantity}개`);
      return;
    }

    if (!createFormData.amount || createFormData.amount === 0) {
      toast.error('상품과 수량을 선택해주세요.');
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      await addOrder({
        customerId: createFormData.customerId,
        customer: createFormData.customer,
        productId: createFormData.productId,
        product: createFormData.product,
        quantity: requestedQuantity,
        amount: createFormData.amount,
        date: today,
        status: ORDER_STATUS.PREPARING,
      });
      toast.success('주문이 성공적으로 생성되었습니다.');
      handleCloseCreateModal();

      // 서버에서 최신 데이터를 가져오기 위해 첫 페이지로 이동하고 강제 새로고침
      setCurrentPage(1);
      // 정렬을 유지하면서 데이터 다시 불러오기
      setTimeout(() => {
        loadOrders();
      }, 100);
    } catch (error: any) {
      // 에러 메시지에서 상세 정보 추출
      const errorMessage = error?.message || '주문 생성에 실패했습니다.';
      toast.error(errorMessage);

      // 단종이나 품절 상태 에러인 경우 모달을 닫지 않고 사용자가 다른 상품을 선택할 수 있도록 함
      // 다른 에러의 경우에도 모달을 유지하여 재시도 가능

      // 에러 발생 시 주문 목록을 다시 로드하여 error 상태 초기화
      setTimeout(() => {
        loadOrders();
      }, 100);
    }
  };

  const renderCustomActions = (order: Order) => (
    <div className="flex gap-2">
      <button
        onClick={() => handleOpenDetailsModal(order)}
        className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 hover:scale-110"
        title="상세보기"
      >
        <Eye size={18} />
      </button>

      {canChangeStatus && (
        <button
          onClick={() => {
            if (order.status === ORDER_STATUS.DELIVERED) {
              toast.error('배송완료된 주문은 상태를 변경할 수 없습니다.');
              return;
            }
            if (order.status === ORDER_STATUS.CANCELLED) {
              toast.error('취소된 주문은 상태를 변경할 수 없습니다.');
              return;
            }
            handleOpenEditModal(order);
          }}
          className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
            order.status === ORDER_STATUS.DELIVERED || order.status === ORDER_STATUS.CANCELLED
              ? 'text-gray-400 cursor-not-allowed hover:bg-transparent hover:scale-100'
              : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
          }`}
          title="상태 변경"
        >
          <Edit2 size={18} />
        </button>
      )}

      {canCancelOrder && (
        <button
          onClick={() => {
            if (order.status === ORDER_STATUS.DELIVERED) {
              toast.error('배송완료된 주문은 취소할 수 없습니다.');
              return;
            }
            if (order.status === ORDER_STATUS.SHIPPING) {
              toast.error('배송중인 주문은 취소할 수 없습니다.');
              return;
            }
            if (order.status === ORDER_STATUS.CANCELLED) {
              toast.error('이미 취소된 주문입니다.');
              return;
            }
            openDeleteModal(order);
            setCancellationReason('');
          }}
          className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
            order.status === ORDER_STATUS.DELIVERED || order.status === ORDER_STATUS.SHIPPING || order.status === ORDER_STATUS.CANCELLED
              ? 'text-gray-400 cursor-not-allowed hover:bg-transparent hover:scale-100'
              : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
          }`}
          title={order.status === ORDER_STATUS.PREPARING ? '주문 취소' : '취소 불가'}
        >
          <Trash2 size={18} />
        </button>
      )}
    </div>
  );

  return (
    <Layout pageTitle="주문 관리">
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded shadow dark:shadow-gray-900/50 p-6">
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 max-w-md">
              <SearchInput
                placeholder="주문번호 또는 고객명으로 검색..."
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
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  className="bg-transparent text-sm border-none focus:ring-0 text-gray-700 dark:text-gray-200 py-1 pl-2 pr-8 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {(statusFilter !== 'all' || searchTerm) && (
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

              {canCreateOrder && (
                <Button onClick={handleOpenCreateModal} className="flex items-center gap-1.5 px-3 py-1.5 h-[38px] text-xs">
                  <Plus size={16} />
                  <span>주문 생성 (CS)</span>
                </Button>
              )}
            </div>
          </div>

          {isLoading ? (
            <TableSkeleton rows={10} />
          ) : error ? (
            <ErrorFallback
              error={error}
              onRetry={loadOrders}
              title="주문 목록을 불러올 수 없습니다"
              message="주문 데이터를 불러오는 중 문제가 발생했습니다. 다시 시도해주세요."
            />
          ) : (
            <>
              <DataTable
                columns={columns}
                data={orders}
                renderCustomActions={renderCustomActions}
                selectable
                highlightRowId={highlightedOrderId || undefined}
                onSort={handleSort}
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                renderCell={(item, columnKey) => {
                  if (columnKey === 'date') {
                    return ensureDateFormat(item.date);
                  }
                  if (columnKey === 'status') {
                    const statusColors: Record<string, string> = {
                      [ORDER_STATUS.PREPARING]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
                      [ORDER_STATUS.SHIPPING]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
                      [ORDER_STATUS.DELIVERED]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                      [ORDER_STATUS.CANCELLED]: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                    };
                    return (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[item.status as string] || 'bg-gray-100 text-gray-800'}`}>
                        {ORDER_STATUS_LABELS[item.status as string] || item.status}
                      </span>
                    );
                  }
                  if (columnKey === 'createdByAdminName') {
                    if (item.createdByAdminName) {
                      return (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                          {item.createdByAdminName}
                        </span>
                      );
                    }
                    return <span className="text-gray-400 dark:text-gray-600">-</span>;
                  }
                  if (columnKey === 'amount') {
                    return formatCurrency(item[columnKey]);
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
        title="주문 상태 변경"
        onSubmit={handleSubmit}
        submitText="변경"
      >
        <div className="space-y-3">
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">주문번호</p>
            <p className="font-semibold dark:text-gray-200">{editingOrder?.id}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">고객명</p>
            <p className="font-semibold dark:text-gray-200">{editingOrder?.customer}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">상품명</p>
            <p className="font-semibold dark:text-gray-200">{editingOrder?.product}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">현재 상태</p>
            <p className="font-semibold dark:text-gray-200">{editingOrder?.status}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              주문 상태 <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <Select
              name="status"
              value={formData}
              onChange={handleFormChange}
              options={orderStatusOptions}
            />
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              💡 상태 변경 흐름: 준비중 → 배송중 → 배송완료
            </p>
            <p className="text-xs text-blue-500 dark:text-blue-500 mt-1">
              배송완료된 주문은 상태를 변경할 수 없습니다.
            </p>
          </div>
        </div>
      </FormModal>

      {/* 삭제 확인 모달 */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        title="주문 취소"
        onConfirm={confirmDelete}
        confirmText="취소"
        cancelText="닫기"
        variant="danger"
      >
        <div className="space-y-4">
          <div>
            <p className="dark:text-gray-300">정말로 <strong>{selectedItem?.id}</strong> 주문을 취소하시겠습니까?</p>
            <p className="text-gray-600 dark:text-gray-400 mt-2">이 작업은 되돌릴 수 없습니다.</p>
          </div>
          <Input
            label="취소 사유"
            name="cancellationReason"
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            placeholder="주문 취소 사유를 입력해주세요"
            required
          />
        </div>
      </Modal>

      {/* 주문 상세 정보 모달 */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        title="주문 상세 정보"
        confirmText="확인"
        onConfirm={handleCloseDetailsModal}
      >
        {isLoadingDetails ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">주문 정보를 불러오는 중...</p>
            </div>
          </div>
        ) : viewingOrder && (
          <div className="space-y-6">
            {/* 주문 기본 정보 */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">주문 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">주문번호</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{viewingOrder.orderNo}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">주문일</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{ensureDateFormat(viewingOrder.date)}</p>
                </div>
              </div>
            </div>

            {/* 고객 정보 */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">고객 정보</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">고객명</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{viewingOrder.customer}</p>
                </div>
                {viewingOrder.customerEmail && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">이메일</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{viewingOrder.customerEmail}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 상품 정보 */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">상품 정보</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">상품명</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{viewingOrder.product}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">수량</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{viewingOrder.quantity}개</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">주문 금액</p>
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(viewingOrder.amount)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 주문 상태 */}
            <div className={viewingOrder.createdByAdminId ? 'border-b border-gray-200 dark:border-gray-700 pb-4' : 'pb-2'}>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">주문 상태</h3>
              <div className={`p-3 rounded-lg ${
                viewingOrder.status === ORDER_STATUS.DELIVERED
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : viewingOrder.status === ORDER_STATUS.SHIPPING
                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                  : viewingOrder.status === ORDER_STATUS.PREPARING
                  ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}>
                <p className={`text-sm font-semibold ${
                  viewingOrder.status === ORDER_STATUS.DELIVERED
                    ? 'text-green-700 dark:text-green-400'
                    : viewingOrder.status === ORDER_STATUS.SHIPPING
                    ? 'text-blue-700 dark:text-blue-400'
                    : viewingOrder.status === ORDER_STATUS.PREPARING
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-red-700 dark:text-red-400'
                }`}>
                  {viewingOrder.status === ORDER_STATUS.DELIVERED && '✅ 배송완료'}
                  {viewingOrder.status === ORDER_STATUS.SHIPPING && '🚚 배송중'}
                  {viewingOrder.status === ORDER_STATUS.PREPARING && '⏳ 준비중'}
                  {viewingOrder.status === ORDER_STATUS.CANCELLED && '❌ 취소됨'}
                </p>
              </div>
            </div>

            {/* CS 주문 관리자 정보 (CS 주문인 경우에만 표시) */}
            {viewingOrder.createdByAdminId && (
              <div className="pb-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">CS 주문 정보</h3>
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-purple-700 dark:text-purple-400">등록 관리자</span>
                    <span className="text-sm font-semibold text-purple-900 dark:text-purple-300">{viewingOrder.createdByAdminName}</span>
                  </div>
                  {viewingOrder.createdByAdminEmail && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-purple-700 dark:text-purple-400">이메일</span>
                      <span className="text-sm text-purple-900 dark:text-purple-300">{viewingOrder.createdByAdminEmail}</span>
                    </div>
                  )}
                  {viewingOrder.createdByAdminRole && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-purple-700 dark:text-purple-400">역할</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        viewingOrder.createdByAdminRole === ROLES.SUPER_ADMIN
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                          : viewingOrder.createdByAdminRole === ROLES.OPERATION_ADMIN
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300'
                      }`}>
                        {ROLE_LABELS[viewingOrder.createdByAdminRole]}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 취소 사유 (취소된 경우에만 표시) */}
            {viewingOrder.status === ORDER_STATUS.CANCELLED && viewingOrder.cancellationReason && (
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-red-900 dark:text-red-400 mb-2">취소 사유</h3>
                <p className="text-sm text-red-700 dark:text-red-300">{viewingOrder.cancellationReason}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 주문 생성 모달 */}
      <FormModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        title="CS 주문 생성"
        onSubmit={handleCreateSubmit}
        submitText="생성"
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              📝 CS 관리자가 고객을 대신하여 주문을 생성합니다
            </p>
            <p className="text-xs text-blue-500 dark:text-blue-500 mt-1">
              • 생성된 주문은 자동으로 "준비중" 상태로 설정됩니다.
            </p>
            <p className="text-xs text-blue-500 dark:text-blue-500">
              • 총 금액은 상품 단가 × 수량으로 자동 계산됩니다.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              고객 <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <Select
              name="customerId"
              value={createFormData.customerId}
              onChange={handleCreateFormChange}
              scrollable
              options={[
                { value: '', label: '고객을 선택하세요' },
                ...customers.map((c) => ({
                  value: c.id,
                  label: `${c.name} (${c.email})`,
                })),
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              상품 <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <Select
              name="productId"
              value={createFormData.productId}
              onChange={handleCreateFormChange}
              scrollable
              options={[
                { value: '', label: '상품을 선택하세요' },
                ...products.map((p) => ({
                  value: p.id,
                  label: `${p.name} (재고: ${p.stock}${p.stock === 0 ? ' - 품절' : ''}, 가격: ${p.price})`,
                })),
              ]}
            />
            {createFormData.productId && (() => {
              const selectedProduct = products.find(p => p.id === createFormData.productId);
              if (selectedProduct && selectedProduct.stock === 0) {
                return (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                    ⚠️ 선택한 상품은 품절 상태입니다. 다른 상품을 선택해주세요.
                  </p>
                );
              }
              if (selectedProduct && parseInt(createFormData.quantity) > selectedProduct.stock) {
                return (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                    ⚠️ 재고 부족: 현재 재고는 {selectedProduct.stock}개입니다.
                  </p>
                );
              }
              return null;
            })()}
          </div>

          <Input
            label="수량"
            name="quantity"
            type="number"
            value={createFormData.quantity}
            onChange={handleCreateFormChange}
            placeholder="수량을 입력하세요"
            min="1"
            required
          />

          <Input
            label="총 금액 (자동 계산)"
            name="amount"
            type="text"
            value={createFormData.amount ? formatCurrency(createFormData.amount) : ''}
            onChange={handleCreateFormChange}
            placeholder="상품과 수량 선택 시 자동 계산됩니다"
            readOnly
            required
          />

          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">주문일</p>
            <p className="font-semibold dark:text-gray-200">
              {new Date().toISOString().split('T')[0]} (오늘)
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">주문 상태</p>
            <p className="font-semibold text-amber-600 dark:text-amber-400">
              준비중 (자동 설정)
            </p>
          </div>
        </div>
      </FormModal>
    </Layout>
  );
};
