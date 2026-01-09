import React from 'react';
import { X } from 'lucide-react';

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  submitText?: string;
  cancelText?: string;
}

export const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  onSubmit,
  submitText = '저장',
  cancelText = '취소',
}) => {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 반투명 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* 모달 컨텐츠 */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl dark:shadow-gray-900/50 w-full max-w-md max-h-[90vh] overflow-y-auto m-4 transform transition-all duration-300 scale-100 animate-in fade-in zoom-in">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10 rounded-t-lg">
          <h3 className="text-lg font-semibold dark:text-gray-200">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors hover:rotate-90 transform duration-200"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {children}
          </div>

          <div className="flex justify-end gap-3 p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-b-lg">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              {cancelText}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-[#4B6CB7] dark:bg-[#6B8DD7] rounded hover:bg-[#3d5a9a] dark:hover:bg-[#5a7cc7] transition-colors shadow-md hover:shadow-lg"
            >
              {submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
