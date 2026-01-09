import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from '../components/Layout';
import { DataTable } from '../components/DataTable';
import { Pagination } from '../components/Pagination';
import { Modal } from '../components/Modal';
import { SearchInput } from '../components/Input';
import { TableSkeleton } from '../components/Skeleton';
import { ErrorFallback } from '../components/ErrorFallback';
import { Eye, Star } from 'lucide-react';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { ROLES } from '../../constants/roles';
import { toast } from 'sonner';
import { ensureDateFormat } from '../../utils/date';
import { reviewsApi } from '../../api';
import type { Column, Review } from '../../types';

const columns: Column[] = [
  { key: 'orderId', label: '주문번호', sortable: true },
  { key: 'customer', label: '고객', sortable: true },
  { key: 'product', label: '상품명', sortable: true },
  { key: 'rating', label: '평점', sortable: true },
  { key: 'comment', label: '리뷰 내용', sortable: false },
  { key: 'date', label: '작성일', sortable: true },
];

export const Reviews: React.FC = () => {
  const currentUser = useAuthStore((state) => state.user);
  const reviews = useDataStore((state) => state.reviews);
  const reviewsPagination = useDataStore((state) => state.reviewsPagination);
  const isLoading = useDataStore((state) => state.isLoading);
  const error = useDataStore((state) => state.error);
  const fetchReviews = useDataStore((state) => state.fetchReviews);
  const deleteReview = useDataStore((state) => state.deleteReview);

  // 권한 체크
  const isSuperAdmin = currentUser?.role === ROLES.SUPER_ADMIN;
  const isOperationAdmin = currentUser?.role === ROLES.OPERATION_ADMIN;
  const canDeleteReview = isSuperAdmin || isOperationAdmin;

  // 로컬 상태 관리
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Review | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [viewingReview, setViewingReview] = useState<Review | null>(null);

  // 서버 요청으로 데이터 가져오기
  const loadReviews = useCallback(() => {
    fetchReviews({
      search: searchTerm,
      page: currentPage,
      limit: 10,
      sortBy: sortBy || undefined,
      sortOrder: sortBy ? sortOrder : undefined,
    });
  }, [fetchReviews, searchTerm, currentPage, sortBy, sortOrder]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

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
  const openDeleteModal = (item: Review) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setSelectedItem(null);
    setIsDeleteModalOpen(false);
  };

  const totalPages = reviewsPagination?.totalPages || 1;

  const handleOpenDeleteModal = (review: Review) => {
    if (!canDeleteReview) {
      toast.error('리뷰 삭제 권한이 없습니다.');
      return;
    }
    openDeleteModal(review);
  };

  const handleOpenDetailsModal = async (review: Review) => {
    setIsDetailsModalOpen(true);
    setIsLoadingDetails(true);
    setViewingReview(null);

    try {
      const details = await reviewsApi.getById(review.id);
      setViewingReview(details);
    } catch (error) {
      toast.error('정보를 불러오는데 실패했습니다.');
      setIsDetailsModalOpen(false);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setViewingReview(null);
  };

  const confirmDelete = async () => {
    if (!canDeleteReview) {
      toast.error('리뷰 삭제 권한이 없습니다.');
      return;
    }

    if (selectedItem) {
      try {
        await deleteReview(selectedItem.id);
        toast.success(`${selectedItem.customer}님의 리뷰가 삭제되었습니다.`);
        closeDeleteModal();

        // 삭제 성공 후 목록 다시 불러오기
        loadReviews();
      } catch (error) {
        toast.error('리뷰 삭제에 실패했습니다.');
      }
    }
  };

  return (
    <Layout pageTitle="리뷰 관리">
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded shadow dark:shadow-gray-900/50 p-6">
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 max-w-md">
              <SearchInput
                placeholder="고객 또는 상품명으로 검색..."
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
              onRetry={loadReviews}
              title="리뷰 목록을 불러올 수 없습니다"
              message="리뷰 데이터를 불러오는 중 문제가 발생했습니다. 다시 시도해주세요."
            />
          ) : (
            <>
              <DataTable
                columns={columns}
                data={reviews}
                onDelete={canDeleteReview ? handleOpenDeleteModal : undefined}
                selectable
                onSort={handleSort}
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                renderCell={(item, columnKey) => {
                  if (columnKey === 'date') {
                    return ensureDateFormat(item.date);
                  }
                  return item[columnKey];
                }}
                renderCustomActions={(item) => (
                  <button
                    onClick={() => handleOpenDetailsModal(item)}
                    className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 hover:scale-110"
                    title="상세보기"
                  >
                    <Eye size={18} />
                  </button>
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

      {/* 삭제 확인 모달 */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        title="리뷰 삭제"
        onConfirm={confirmDelete}
        confirmText="삭제"
        cancelText="취소"
        variant="danger"
      >
        <p className="dark:text-gray-300">정말로 <strong>{selectedItem?.user}</strong>님의 리뷰를 삭제하시겠습니까?</p>
        <p className="text-gray-600 dark:text-gray-400 mt-2">이 작업은 되돌릴 수 없습니다.</p>
      </Modal>

      {/* 리뷰 상세 정보 모달 */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        title="리뷰 상세 정보"
        confirmText="확인"
        onConfirm={handleCloseDetailsModal}
      >
        {isLoadingDetails ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">리뷰 정보를 불러오는 중...</p>
          </div>
        ) : viewingReview && (
          <div className="space-y-6">
            {/* 상품 정보 */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">상품 정보</h3>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">상품명</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{viewingReview.product}</p>
              </div>
            </div>

            {/* 리뷰 작성자 */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">작성자 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">작성자</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{viewingReview.customer}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">작성일</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{ensureDateFormat(viewingReview.date)}</p>
                </div>
              </div>
            </div>

            {/* 평점 */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">평점</h3>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{viewingReview.rating}.0</span>
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < viewingReview.rating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* 리뷰 내용 */}
            <div className="pb-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">리뷰 내용</h3>
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {viewingReview.comment}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};
