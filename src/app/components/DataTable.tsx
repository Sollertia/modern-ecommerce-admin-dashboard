import React, { useState, useMemo } from 'react';
import { Trash2, Edit, ChevronUp, ChevronDown } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  selectable?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
  renderCustomActions?: (item: any) => React.ReactNode;
  renderCell?: (item: any, columnKey: string) => React.ReactNode;
  highlightRowId?: string;
  onSort?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  currentSortBy?: string;
  currentSortOrder?: 'asc' | 'desc';
}

export const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  onEdit,
  onDelete,
  selectable = false,
  onSelectionChange,
  renderCustomActions,
  renderCell,
  highlightRowId,
  onSort,
  currentSortBy,
  currentSortOrder,
}) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const handleSelectAll = (checked: boolean) => {
    const newSelected = checked ? new Set(data.map((item) => item.id)) : new Set<string>();
    setSelectedItems(newSelected);
    onSelectionChange?.(Array.from(newSelected));
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
    onSelectionChange?.(Array.from(newSelected));
  };

  const handleSort = (key: string) => {
    if (!onSort) return;

    let nextSortOrder: 'asc' | 'desc' = 'asc';
    if (currentSortBy === key && currentSortOrder === 'asc') {
      nextSortOrder = 'desc';
    }
    
    // 정렬 취소 기능이 필요하다면 여기서 처리 (현재는 asc -> desc -> asc 순환으로 가정하거나, asc -> desc -> 초기화)
    // 여기서는 단순하게 asc <-> desc 토글로 구현
    onSort(key, nextSortOrder);
  };

  const isAllSelected = useMemo(() => 
    data.length > 0 && selectedItems.size === data.length, 
    [data.length, selectedItems.size]
  );

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full">
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {selectable && (
              <th className="p-4 text-left w-12">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                />
              </th>
            )}
            {columns.map((column) => (
              <th key={column.key} className="p-4 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{column.label}</span>
                  {column.sortable && (
                    <button
                      onClick={() => handleSort(column.key)}
                      className="text-gray-400 dark:text-gray-500 hover:text-[#4B6CB7] dark:hover:text-[#6B8DD7] transition-colors duration-200"
                    >
                      {currentSortBy === column.key ? (
                        currentSortOrder === 'asc' ? (
                          <ChevronUp size={16} className="text-[#4B6CB7] dark:text-[#6B8DD7]" />
                        ) : (
                          <ChevronDown size={16} className="text-[#4B6CB7] dark:text-[#6B8DD7]" />
                        )
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </button>
                  )}
                </div>
              </th>
            ))}
            {(onEdit || onDelete || renderCustomActions) && (
              <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300 w-24">작업</th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800">
          {data.map((item, index) => {
            const isHighlighted = highlightRowId === item.id;
            const isSelected = selectedItems.has(item.id);
            
            return (
              <tr
                key={item.id}
                className={`border-b border-gray-100 dark:border-gray-700 transition-all duration-200 hover:bg-gradient-to-r hover:from-[#4B6CB7]/5 dark:hover:from-[#6B8DD7]/10 hover:to-transparent hover:shadow-sm ${
                  isHighlighted
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 ring-2 ring-yellow-400 dark:ring-yellow-600'
                    : isSelected 
                      ? 'bg-blue-50/50 dark:bg-blue-900/10'
                      : index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/30 dark:bg-gray-800/50'
                }`}
              >
                {selectable && (
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 cursor-pointer"
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td key={column.key} className="p-4 text-gray-700 dark:text-gray-300">
                    {renderCell ? renderCell(item, column.key) : item[column.key]}
                  </td>
                ))}
                {(onEdit || onDelete || renderCustomActions) && (
                  <td className="p-4">
                    <div className="flex gap-2 items-center">
                      {renderCustomActions && renderCustomActions(item)}
                      {onEdit && (
                        <button
                          onClick={() => onEdit(item)}
                          className="p-2 rounded-lg text-[#4B6CB7] dark:text-[#6B8DD7] hover:bg-[#4B6CB7]/10 dark:hover:bg-[#6B8DD7]/20 transition-all duration-200 hover:scale-110"
                          title="수정"
                        >
                          <Edit size={18} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(item)}
                          className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 hover:scale-110"
                          title="삭제"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0) + ((onEdit || onDelete || renderCustomActions) ? 1 : 0)} className="p-8 text-center text-gray-500 dark:text-gray-400">
                데이터가 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
