import { useState, useMemo } from 'react';

interface UseDataTableProps<T> {
  data: T[];
  itemsPerPage?: number;
}

interface UseDataTableReturn<T> {
  // Pagination
  currentPage: number;
  totalPages: number;
  paginatedData: T[];
  setCurrentPage: (page: number) => void;

  // Search
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredData: T[];

  // Modal
  isDeleteModalOpen: boolean;
  selectedItem: T | null;
  openDeleteModal: (item: T) => void;
  closeDeleteModal: () => void;
}

export function useDataTable<T extends { id: string }>({
  data,
  itemsPerPage = 10,
}: UseDataTableProps<T>): UseDataTableReturn<T> {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);

  // 검색된 데이터
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;

    const lowerSearch = searchTerm.toLowerCase();
    return data.filter((item) => {
      return Object.values(item).some((value) =>
        String(value).toLowerCase().includes(lowerSearch)
      );
    });
  }, [data, searchTerm]);

  // 총 페이지 수
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // 현재 페이지 데이터
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, itemsPerPage]);

  // 모달 관리
  const openDeleteModal = (item: T) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setSelectedItem(null);
    setIsDeleteModalOpen(false);
  };

  // 검색어 변경 시 첫 페이지로
  const handleSetSearchTerm = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  return {
    currentPage,
    totalPages,
    paginatedData,
    setCurrentPage,
    searchTerm,
    setSearchTerm: handleSetSearchTerm,
    filteredData,
    isDeleteModalOpen,
    selectedItem,
    openDeleteModal,
    closeDeleteModal,
  };
}
