import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorFallbackProps {
  error?: Error | string;
  onRetry?: () => void;
  title?: string;
  message?: string;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  onRetry,
  title = '데이터를 불러올 수 없습니다',
  message = '데이터를 불러오는 중 문제가 발생했습니다. 다시 시도해주세요.',
}) => {
  const errorMessage = typeof error === 'string' ? error : error?.message;

  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <div className="text-center max-w-md">
        <div className="mb-4 flex justify-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {title}
        </h3>

        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {message}
        </p>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400 font-mono break-words">
              {errorMessage}
            </p>
          </div>
        )}

        {onRetry && (
          <Button onClick={onRetry} className="flex items-center gap-2 mx-auto">
            <RefreshCw size={18} />
            다시 시도
          </Button>
        )}
      </div>
    </div>
  );
};
