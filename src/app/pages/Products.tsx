import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { DataTable } from '../components/DataTable';
import { Pagination } from '../components/Pagination';
import { Modal } from '../components/Modal';
import { FormModal } from '../components/FormModal';
import { SearchInput, Input, Select } from '../components/Input';
import { Button } from '../components/Button';
import { TableSkeleton } from '../components/Skeleton';
import { ErrorFallback } from '../components/ErrorFallback';
import {PackagePlus, AlertTriangle, Eye, Star, Filter, RefreshCw, Edit2, Archive, Edit} from 'lucide-react';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { ROLES, ROLE_LABELS, PRODUCT_STATUS, PRODUCT_CATEGORIES, PRODUCT_STATUS_LABELS, PRODUCT_CATEGORY_LABELS } from '../../constants/roles';
import { toast } from 'sonner';
import { ensureDateFormat } from '../../utils/date';
import { productsApi } from '../../api';
import type { Column, Product, ProductStatus } from '../../types';

const columns: Column[] = [
  { key: 'name', label: '상품명', sortable: true },
  { key: 'category', label: '카테고리', sortable: true },
  { key: 'price', label: '가격', sortable: true },
  { key: 'stock', label: '재고', sortable: true },
  { key: 'status', label: '상태', sortable: true },
  { key: 'createdAt', label: '등록일', sortable: true },
  { key: 'createdByName', label: '등록 관리자', sortable: true },
];

const statusFilterOptions = [
  { value: 'all', label: '전체 상태' },
  { value: PRODUCT_STATUS.AVAILABLE, label: '판매중' },
  { value: PRODUCT_STATUS.SOLD_OUT, label: '품절' },
  { value: PRODUCT_STATUS.DISCONTINUED, label: '단종' },
];

const categoryFilterOptions = [
  { value: 'all', label: '전체 카테고리' },
  { value: PRODUCT_CATEGORIES.ELECTRONICS, label: '전자기기' },
  { value: PRODUCT_CATEGORIES.FASHION, label: '패션/의류' },
  { value: PRODUCT_CATEGORIES.FOOD, label: '식품' },
  { value: PRODUCT_CATEGORIES.LIVING, label: '생활용품' },
  { value: PRODUCT_CATEGORIES.SPORTS, label: '스포츠/레저' },
  { value: PRODUCT_CATEGORIES.BEAUTY, label: '뷰티/화장품' },
  { value: PRODUCT_CATEGORIES.BOOKS, label: '도서' },
  { value: PRODUCT_CATEGORIES.TOYS, label: '완구/취미' },
];

const statusOptions = [
  { value: PRODUCT_STATUS.AVAILABLE, label: '판매중' },
  { value: PRODUCT_STATUS.SOLD_OUT, label: '품절' },
  { value: PRODUCT_STATUS.DISCONTINUED, label: '단종' },
];

const categoryOptions = [
  { value: PRODUCT_CATEGORIES.ELECTRONICS, label: '전자기기' },
  { value: PRODUCT_CATEGORIES.FASHION, label: '패션/의류' },
  { value: PRODUCT_CATEGORIES.FOOD, label: '식품' },
  { value: PRODUCT_CATEGORIES.LIVING, label: '생활용품' },
  { value: PRODUCT_CATEGORIES.SPORTS, label: '스포츠/레저' },
  { value: PRODUCT_CATEGORIES.BEAUTY, label: '뷰티/화장품' },
  { value: PRODUCT_CATEGORIES.BOOKS, label: '도서' },
  { value: PRODUCT_CATEGORIES.TOYS, label: '완구/취미' },
];

export const Products: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightedProductId = searchParams.get('productId');

  const currentUser = useAuthStore((state) => state.user);
  const products = useDataStore((state) => state.products);
  const productsPagination = useDataStore((state) => state.productsPagination);
  const isLoading = useDataStore((state) => state.isLoading);
  const error = useDataStore((state) => state.error);
  const fetchProducts = useDataStore((state) => state.fetchProducts);
  const addProduct = useDataStore((state) => state.addProduct);
  const updateProduct = useDataStore((state) => state.updateProduct);
  const updateProductStock = useDataStore((state) => state.updateProductStock);
  const updateProductStatus = useDataStore((state) => state.updateProductStatus);
  const deleteProduct = useDataStore((state) => state.deleteProduct);

  // 권한 체크
  const isSuperAdmin = currentUser?.role === ROLES.SUPER_ADMIN;
  const isOperationAdmin = currentUser?.role === ROLES.OPERATION_ADMIN;
  const canManageProducts = isSuperAdmin || isOperationAdmin;

  // 로컬 상태 관리
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Product | null>(null);

  // 서버 요청으로 데이터 가져오기
  const loadProducts = useCallback(() => {
    fetchProducts({
      search: searchTerm,
      page: currentPage,
      limit: 10,
      status: statusFilter === 'all' ? undefined : statusFilter,
      category: categoryFilter === 'all' ? undefined : categoryFilter,
      sortBy: sortBy || undefined,
      sortOrder: sortBy ? sortOrder : undefined,
    });
  }, [fetchProducts, searchTerm, currentPage, statusFilter, categoryFilter, sortBy, sortOrder]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // 검색어 변경 시 첫 페이지로
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // 필터 변경 핸들러
  const handleCategoryFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategoryFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  // 필터 초기화
  const handleResetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
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
  const openDeleteModal = (item: Product) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setSelectedItem(null);
    setIsDeleteModalOpen(false);
  };

  const totalPages = productsPagination?.totalPages || 1;

  // 페이지 레벨 접근 제어
  if (!canManageProducts) {
    return (
      <Layout pageTitle="상품 관리">
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
              상품 관리는 슈퍼 관리자와 운영 관리자만 접근할 수 있습니다.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              현재 역할: <span className="font-semibold">{currentUser?.role ? ROLE_LABELS[currentUser.role] : '-'}</span>
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockChangingProduct, setStockChangingProduct] = useState<Product | null>(null);
  const [statusChangingProduct, setStatusChangingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: PRODUCT_CATEGORIES.ELECTRONICS,
    price: '',
  });
  const [stockFormData, setStockFormData] = useState<number>(0);
  const [statusFormData, setStatusFormData] = useState<ProductStatus>(PRODUCT_STATUS.AVAILABLE);

  const handleOpenAddModal = () => {
    if (!canManageProducts) {
      toast.error('상품 관리 권한이 없습니다.');
      return;
    }
    setEditingProduct(null);
    setFormData({
      name: '',
      category: PRODUCT_CATEGORIES.ELECTRONICS,
      price: '',
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    if (!canManageProducts) {
      toast.error('상품 관리 권한이 없습니다.');
      return;
    }
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price,
    });
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setEditingProduct(null);
  };

  const handleOpenStockModal = (product: Product) => {
    if (!canManageProducts) {
      toast.error('상품 관리 권한이 없습니다.');
      return;
    }
    setStockChangingProduct(product);
    setStockFormData(product.stock);
    setIsStockModalOpen(true);
  };

  const handleCloseStockModal = () => {
    setIsStockModalOpen(false);
    setStockChangingProduct(null);
  };

  const handleOpenStatusModal = (product: Product) => {
    if (!canManageProducts) {
      toast.error('상품 관리 권한이 없습니다.');
      return;
    }
    setStatusChangingProduct(product);
    setStatusFormData(product.status);
    setIsStatusModalOpen(true);
  };

  const handleCloseStatusModal = () => {
    setIsStatusModalOpen(false);
    setStatusChangingProduct(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // 상품 추가 시에만 사용되는 핸들러 (재고, 상태 포함)
  const [addFormData, setAddFormData] = useState({
    name: '',
    category: PRODUCT_CATEGORIES.ELECTRONICS,
    price: '',
    stock: 0,
    status: PRODUCT_STATUS.AVAILABLE as ProductStatus,
  });

  const handleAddFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.name === 'stock' ? parseInt(e.target.value) || 0 : e.target.value;
    setAddFormData({
      ...addFormData,
      [e.target.name]: value,
    });
  };

  const handleSubmit = async () => {
    if (editingProduct) {
      // 편집 모드: 기본 정보만 수정
      if (!formData.name || !formData.category || !formData.price) {
        toast.error('모든 필드를 입력해주세요.');
        return;
      }

      try {
        await updateProduct(editingProduct.id, formData);
        toast.success(`${formData.name} 상품 정보가 수정되었습니다.`);
        handleCloseFormModal();
      } catch (error) {
        toast.error('상품 정보 수정에 실패했습니다.');
      }
    } else {
      // 추가 모드: 모든 정보 입력 (별도 상태 사용)
    }
  };

  // 추가 전용 제출 핸들러
  const handleAddSubmit = async () => {
    if (!addFormData.name || !addFormData.category || !addFormData.price) {
      toast.error('모든 필드를 입력해주세요.');
      return;
    }

    // 재고가 0이면 자동으로 품절 처리
    const status = addFormData.stock === 0 ? PRODUCT_STATUS.SOLD_OUT : addFormData.status;

    try {
      await addProduct({
        ...addFormData,
        status
      });
      toast.success(`${addFormData.name} 상품이 추가되었습니다.`);
      
      // 폼 초기화
      setAddFormData({
        name: '',
        category: PRODUCT_CATEGORIES.ELECTRONICS,
        price: '',
        stock: 0,
        status: PRODUCT_STATUS.AVAILABLE,
      });
      
      handleCloseFormModal();
      
      // 서버에서 최신 데이터를 가져오기 위해 첫 페이지로 이동하고 강제 새로고침
      setCurrentPage(1);
      setTimeout(() => {
        loadProducts();
      }, 100);
    } catch (error) {
      toast.error('상품 추가에 실패했습니다.');
    }
  };

  const handleStockSubmit = async () => {
    if (!stockChangingProduct) return;

    try {
      await updateProductStock(stockChangingProduct.id, stockFormData);
      toast.success(`${stockChangingProduct.name} 상품의 재고가 수정되었습니다.`);
      handleCloseStockModal();
    } catch (error) {
      toast.error('재고 수정에 실패했습니다.');
    }
  };

  const handleStatusSubmit = async () => {
    if (!statusChangingProduct) return;

    try {
      await updateProductStatus(statusChangingProduct.id, statusFormData);
      toast.success(`${statusChangingProduct.name} 상품의 상태가 수정되었습니다.`);
      handleCloseStatusModal();
    } catch (error) {
      toast.error('상태 수정에 실패했습니다.');
    }
  };

  const confirmDelete = async () => {
    if (!canManageProducts) {
      toast.error('상품 관리 권한이 없습니다.');
      return;
    }

    if (selectedItem) {
      try {
        await deleteProduct(selectedItem.id);
        toast.success(`${selectedItem.name} 상품이 삭제되었습니다.`);
        closeDeleteModal();

        // 삭제 성공 후 목록 다시 불러오기
        loadProducts();
      } catch (error: any) {
        // 에러 메시지 표시
        const errorMessage = error?.message || '상품 삭제에 실패했습니다.';
        toast.error(errorMessage);

        // 모달 닫기
        closeDeleteModal();
      }
    }
  };

  const handleOpenDetailsModal = async (product: Product) => {
    setIsDetailsModalOpen(true);
    setIsLoadingDetails(true);
    setViewingProduct(null);

    try {
      // API로 상품 상세 정보 조회 (리뷰 요약 및 최근 리뷰 포함)
      const productDetails = await productsApi.getById(product.id);
      setViewingProduct(productDetails);
    } catch (error) {
      toast.error('상품 정보를 불러오는데 실패했습니다.');
      setIsDetailsModalOpen(false);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setViewingProduct(null);
  };

  const renderCustomActions = (product: Product) => (
    <div className="flex gap-2">
      <button
        onClick={() => handleOpenDetailsModal(product)}
        className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 hover:scale-110"
        title="상세보기"
      >
        <Eye size={18} />
      </button>
      <button
        onClick={() => handleOpenStockModal(product)}
        className="p-2 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all duration-200 hover:scale-110"
        title="재고 수정"
      >
        <Archive size={18} />
      </button>
      <button
        onClick={() => handleOpenStatusModal(product)}
        className="p-2 rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200 hover:scale-110"
        title="상태 수정"
      >
        <Edit2 size={18} />
      </button>
      <button
          onClick={() => handleOpenEditModal(product)}
          className="p-2 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-200 hover:scale-110"
          title="정보 수정"
      >
        <Edit size={18} />
      </button>
    </div>
  );

  return (
    <Layout pageTitle="상품 관리">
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded shadow dark:shadow-gray-900/50 p-6">
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 max-w-md">
              <SearchInput
                placeholder="상품명 검색..."
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
                  value={categoryFilter}
                  onChange={handleCategoryFilterChange}
                  className="bg-transparent text-sm border-none focus:ring-0 text-gray-700 dark:text-gray-200 py-1 pl-2 pr-8 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                >
                  {categoryFilterOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
                <select
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  className="bg-transparent text-sm border-none focus:ring-0 text-gray-700 dark:text-gray-200 py-1 pl-2 pr-8 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                >
                  {statusFilterOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {(categoryFilter !== 'all' || statusFilter !== 'all' || searchTerm) && (
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

              <Button onClick={() => {
                setEditingProduct(null);
                setAddFormData({
                  name: '',
                  category: PRODUCT_CATEGORIES.ELECTRONICS,
                  price: '',
                  stock: 0,
                  status: PRODUCT_STATUS.AVAILABLE,
                });
                setIsFormModalOpen(true);
              }} className="flex items-center gap-1.5 px-3 py-1.5 h-[38px] text-xs">
                <PackagePlus size={16} />
                <span>상품 추가</span>
              </Button>
            </div>
          </div>

          {isLoading ? (
            <TableSkeleton rows={10} />
          ) : error ? (
            <ErrorFallback
              error={error}
              onRetry={loadProducts}
              title="상품 목록을 불러올 수 없습니다"
              message="상품 데이터를 불러오는 중 문제가 발생했습니다. 다시 시도해주세요."
            />
          ) : (
            <>
              <DataTable
                columns={columns}
                data={products}
                onDelete={openDeleteModal}
                renderCustomActions={renderCustomActions}
                selectable
                highlightRowId={highlightedProductId || undefined}
                onSort={handleSort}
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                renderCell={(item, columnKey) => {
                  if (columnKey === 'createdAt') {
                    return ensureDateFormat(item.createdAt);
                  }
                  if (columnKey === 'status') {
                    const statusColors: Record<string, string> = {
                      [PRODUCT_STATUS.AVAILABLE]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                      [PRODUCT_STATUS.SOLD_OUT]: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                      [PRODUCT_STATUS.DISCONTINUED]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
                    };
                    return (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[item.status as string] || 'bg-gray-100 text-gray-800'}`}>
                        {PRODUCT_STATUS_LABELS[item.status as string] || item.status}
                      </span>
                    );
                  }
                  if (columnKey === 'category') {
                    return (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        {PRODUCT_CATEGORY_LABELS[item.category as string] || item.category}
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

      {/* 추가/편집 모달 */}
      <FormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={editingProduct ? '상품 정보 수정' : '상품 추가'}
        onSubmit={editingProduct ? handleSubmit : handleAddSubmit}
        submitText={editingProduct ? '수정' : '추가'}
      >
        {editingProduct ? (
          // 편집 모드: 기본 정보만 표시
          <>
            <Input
              label="상품명"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              placeholder="무선 이어폰"
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                카테고리
              </label>
              <Select
                name="category"
                value={formData.category}
                onChange={handleFormChange}
                options={categoryOptions}
              />
            </div>
            <Input
              label="가격"
              name="price"
              value={formData.price}
              onChange={handleFormChange}
              placeholder="89,000원"
              required
            />
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                💡 재고와 상태는 별도의 버튼으로 수정할 수 있습니다.
              </p>
            </div>
          </>
        ) : (
          // 추가 모드: 모든 정보 표시
          <>
            <Input
              label="상품명"
              name="name"
              value={addFormData.name}
              onChange={handleAddFormChange}
              placeholder="무선 이어폰"
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                카테고리
              </label>
              <Select
                name="category"
                value={addFormData.category}
                onChange={handleAddFormChange}
                options={categoryOptions}
              />
            </div>
            <Input
              label="가격"
              name="price"
              value={addFormData.price}
              onChange={handleAddFormChange}
              placeholder="89,000원"
              required
            />
            <Input
              label="재고"
              name="stock"
              type="number"
              value={addFormData.stock.toString()}
              onChange={handleAddFormChange}
              placeholder="0"
              min="0"
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                상태
              </label>
              <Select
                name="status"
                value={addFormData.status}
                onChange={handleAddFormChange}
                options={statusOptions}
              />
            </div>
            {addFormData.stock === 0 && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                  ⚠️ 재고가 0이면 자동으로 품절 처리됩니다.
                </p>
              </div>
            )}
          </>
        )}
      </FormModal>

      {/* 재고 수정 모달 */}
      <FormModal
        isOpen={isStockModalOpen}
        onClose={handleCloseStockModal}
        title="재고 수정"
        onSubmit={handleStockSubmit}
        submitText="수정"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">상품명</p>
            <p className="font-semibold dark:text-gray-200">{stockChangingProduct?.name}</p>
          </div>
          <Input
            label="재고 수량"
            name="stock"
            type="number"
            value={stockFormData.toString()}
            onChange={(e) => setStockFormData(parseInt(e.target.value) || 0)}
            placeholder="0"
            min="0"
            required
          />
          {stockFormData === 0 && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                ⚠️ 재고가 0이면 자동으로 품절 처리됩니다.
              </p>
            </div>
          )}
          {stockFormData > 0 && stockFormData <= 5 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                ⚠️ 재고가 5개 이하입니다. 재고를 보충해주세요.
              </p>
            </div>
          )}
        </div>
      </FormModal>

      {/* 상태 수정 모달 */}
      <FormModal
        isOpen={isStatusModalOpen}
        onClose={handleCloseStatusModal}
        title="상태 수정"
        onSubmit={handleStatusSubmit}
        submitText="수정"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">상품명</p>
            <p className="font-semibold dark:text-gray-200">{statusChangingProduct?.name}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">현재 상태</p>
            <p className="font-semibold dark:text-gray-200">
              {statusChangingProduct?.status ? PRODUCT_STATUS_LABELS[statusChangingProduct.status] : '-'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              변경할 상태 <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <Select
              name="status"
              value={statusFormData}
              onChange={(e) => setStatusFormData(e.target.value as ProductStatus)}
              options={statusOptions}
            />
          </div>
        </div>
      </FormModal>

      {/* 삭제 확인 모달 */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        title="상품 삭제"
        onConfirm={confirmDelete}
        confirmText="삭제"
        cancelText="취소"
        variant="danger"
      >
        <p className="dark:text-gray-300">정말로 <strong>{selectedItem?.name}</strong> 상품을 삭제하시겠습니까?</p>
        <p className="text-gray-600 dark:text-gray-400 mt-2">이 작업은 되돌릴 수 없습니다.</p>
      </Modal>

      {/* 상품 상세 정보 모달 */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        title="상품 상세 정보"
        confirmText="확인"
        onConfirm={handleCloseDetailsModal}
      >
        {isLoadingDetails ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">상품 정보를 불러오는 중...</p>
            </div>
          </div>
        ) : viewingProduct && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            {/* 상품 이미지 */}
            {viewingProduct.image && (
              <div className="w-full h-48 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                <img
                  src={viewingProduct.image}
                  alt={viewingProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* 기본 정보 */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">기본 정보</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">상품명</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{viewingProduct.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">카테고리</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{viewingProduct.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">가격</p>
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{viewingProduct.price}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 재고 및 판매 상태 */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">재고 및 판매 상태</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">재고</p>
                  <p className={`text-sm font-semibold ${
                    viewingProduct.stock === 0
                      ? 'text-red-600 dark:text-red-400'
                      : viewingProduct.stock <= 5
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    {viewingProduct.stock}개
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">판매 상태</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                    viewingProduct.status === PRODUCT_STATUS.AVAILABLE
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : viewingProduct.status === PRODUCT_STATUS.DISCONTINUED
                      ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {PRODUCT_STATUS_LABELS[viewingProduct.status] || viewingProduct.status}
                  </span>
                </div>
              </div>
              {/* 재고 상태 메시지 */}
              {viewingProduct.stock === 0 && (
                <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300">
                  ❌ 현재 품절 상태입니다.
                </div>
              )}
              {viewingProduct.stock > 0 && viewingProduct.stock <= 5 && (
                <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded text-sm text-amber-700 dark:text-amber-300">
                  ⚠️ 재고가 부족합니다. 재고 보충이 필요합니다.
                </div>
              )}
              {viewingProduct.stock > 5 && (
                <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded text-sm text-green-700 dark:text-green-300">
                  ✅ 재고가 충분합니다.
                </div>
              )}
            </div>

            {/* 등록 정보 */}
            <div className="pb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">등록 정보</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">등록일</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{ensureDateFormat(viewingProduct.createdAt)}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">등록 관리자</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{viewingProduct.createdByName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">이메일</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{viewingProduct.createdByEmail || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 리뷰 섹션 */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                상품 리뷰
              </h3>

              {viewingProduct.reviewSummary && viewingProduct.reviewSummary.totalReviews > 0 ? (
                <div>
                  {/* 리뷰 요약 */}
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800 mb-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                      {/* 평균 평점 */}
                      <div className="flex flex-col items-center justify-center min-w-[140px]">
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="text-5xl font-bold text-yellow-600 dark:text-yellow-400">
                            {viewingProduct.reviewSummary.averageRating.toFixed(1)}
                          </span>
                          <span className="text-2xl text-gray-500 dark:text-gray-400">/5</span>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-5 h-5 ${
                                i < Math.round(viewingProduct.reviewSummary.averageRating)
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-300 dark:text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          총 {viewingProduct.reviewSummary.totalReviews}개 리뷰
                        </p>
                      </div>

                      {/* 별점 분포 */}
                      <div className="flex-1 w-full">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 dark:text-gray-400 w-12">5점</span>
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                              <div
                                className="bg-yellow-400 h-3 rounded-full transition-all"
                                style={{ width: `${(viewingProduct.reviewSummary.fiveStarCount / viewingProduct.reviewSummary.totalReviews) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400 w-10 text-right font-medium">
                              {viewingProduct.reviewSummary.fiveStarCount}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 dark:text-gray-400 w-12">4점</span>
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                              <div
                                className="bg-yellow-400 h-3 rounded-full transition-all"
                                style={{ width: `${(viewingProduct.reviewSummary.fourStarCount / viewingProduct.reviewSummary.totalReviews) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400 w-10 text-right font-medium">
                              {viewingProduct.reviewSummary.fourStarCount}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 dark:text-gray-400 w-12">3점</span>
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                              <div
                                className="bg-yellow-400 h-3 rounded-full transition-all"
                                style={{ width: `${(viewingProduct.reviewSummary.threeStarCount / viewingProduct.reviewSummary.totalReviews) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400 w-10 text-right font-medium">
                              {viewingProduct.reviewSummary.threeStarCount}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 dark:text-gray-400 w-12">2점</span>
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                              <div
                                className="bg-yellow-400 h-3 rounded-full transition-all"
                                style={{ width: `${(viewingProduct.reviewSummary.twoStarCount / viewingProduct.reviewSummary.totalReviews) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400 w-10 text-right font-medium">
                              {viewingProduct.reviewSummary.twoStarCount}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 dark:text-gray-400 w-12">1점</span>
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                              <div
                                className="bg-yellow-400 h-3 rounded-full transition-all"
                                style={{ width: `${(viewingProduct.reviewSummary.oneStarCount / viewingProduct.reviewSummary.totalReviews) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400 w-10 text-right font-medium">
                              {viewingProduct.reviewSummary.oneStarCount}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 최근 리뷰 미리보기 */}
                  {viewingProduct.recentReviews && viewingProduct.recentReviews.length > 0 && (
                    <>
                      <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">
                        최근 리뷰
                      </h4>
                      <div className="space-y-3 mb-4">
                        {viewingProduct.recentReviews.map((review) => (
                          <div
                            key={review.id}
                            className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                  {review.customer}
                                </p>
                                <div className="flex items-center gap-1 mt-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < review.rating
                                          ? 'text-yellow-400 fill-yellow-400'
                                          : 'text-gray-300 dark:text-gray-600'
                                      }`}
                                    />
                                  ))}
                                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                                    {review.rating}.0
                                  </span>
                                </div>
                              </div>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {ensureDateFormat(review.date)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                              {review.comment}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* 더보기 버튼 */}
                      {viewingProduct.reviewSummary.totalReviews > 3 && (
                        <Button
                          onClick={() => {
                            handleCloseDetailsModal();
                            window.location.href = `/reviews?productId=${viewingProduct.id}`;
                          }}
                          variant="secondary"
                          className="w-full"
                        >
                          전체 리뷰 보기 ({viewingProduct.reviewSummary.totalReviews}개)
                        </Button>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Star className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <p>아직 작성된 리뷰가 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};
