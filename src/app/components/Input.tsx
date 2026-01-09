import React, { useState, useRef, useEffect } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  scrollable?: boolean; // 스크롤 가능한 리스트박스 모드
}

export const Input: React.FC<InputProps> = ({ label, className = '', readOnly, ...props }) => {
  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-gray-700 dark:text-gray-300">{label}</label>}
      <input
        className={`px-3 py-2 border border-gray-300 dark:border-gray-600 rounded ${
          readOnly
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-not-allowed'
            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
        } placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4B6CB7] dark:focus:ring-[#6B8DD7] focus:border-transparent ${className}`}
        readOnly={readOnly}
        {...props}
      />
    </div>
  );
};

const NativeSelect: React.FC<SelectProps> = ({ label, options, className = '', ...props }) => (
  <div className="flex flex-col gap-2">
    {label && <label className="text-gray-700 dark:text-gray-300">{label}</label>}
    <select
      className={`px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#4B6CB7] dark:focus:ring-[#6B8DD7] focus:border-transparent appearance-none bg-no-repeat bg-right cursor-pointer ${className}`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
        backgroundPosition: 'right 0.75rem center',
        backgroundSize: '12px',
      }}
      {...props}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

const CustomSelect: React.FC<SelectProps> = ({ label, options, className = '', value, onChange, name }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 선택된 옵션 찾기
  const selectedOption = options.find(opt => opt.value === value);
  const displayValue = selectedOption ? selectedOption.label : options[0]?.label || '';

  // 검색어로 필터링된 옵션
  const filteredOptions = searchTerm
    ? options.filter(opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase()))
    : options;

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    if (onChange) {
      const event = {
        target: {
          name: name || '',
          value: optionValue,
        },
      } as React.ChangeEvent<HTMLSelectElement>;
      onChange(event);
    }
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="flex flex-col gap-2" ref={dropdownRef}>
      {label && <label className="text-gray-700 dark:text-gray-300">{label}</label>}
      <div className="relative">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className={`px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4B6CB7] dark:focus:ring-[#6B8DD7] focus:border-transparent ${className}`}
        >
          {displayValue}
        </div>
        <div
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ marginTop: '-1px' }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
          >
            <path fill="#666" d="M6 9L1 4h10z" />
          </svg>
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-lg max-h-64 overflow-hidden flex flex-col">
            {/* 검색 입력 */}
            <div className="p-2 border-b border-gray-200 dark:border-gray-600">
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="검색..."
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#4B6CB7] dark:focus:ring-[#6B8DD7]"
                autoFocus
              />
            </div>

            {/* 옵션 리스트 */}
            <div className="overflow-y-auto max-h-56">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  검색 결과가 없습니다.
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={`px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 ${
                      option.value === value ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    {option.label}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const Select: React.FC<SelectProps> = ({ scrollable = false, ...props }) => {
  if (scrollable) {
    return <CustomSelect {...props} />;
  }
  return <NativeSelect {...props} />;
};

export const SearchInput: React.FC<InputProps & { onSearch?: (value: string) => void }> = ({ className = '', onSearch, onChange, onKeyDown, ...props }) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(e.currentTarget.value);
    }
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  return (
    <input
      type="search"
      className={`px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4B6CB7] dark:focus:ring-[#6B8DD7] focus:border-transparent ${className}`}
      onKeyDown={handleKeyDown}
      onChange={onChange}
      {...props}
    />
  );
};
