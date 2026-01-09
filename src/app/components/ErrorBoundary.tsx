import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50 p-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-2">
              문제가 발생했습니다
            </h1>

            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
              애플리케이션에서 예상치 못한 오류가 발생했습니다. 페이지를 새로고침하여 다시 시도해주세요.
            </p>

            {this.state.error && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  오류 메시지:
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 font-mono break-words">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <Button onClick={this.handleReset} className="w-full flex items-center justify-center gap-2">
              <RefreshCw size={18} />
              페이지 새로고침
            </Button>

            <p className="text-xs text-center text-gray-500 dark:text-gray-500 mt-4">
              문제가 지속되면 관리자에게 문의해주세요.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
