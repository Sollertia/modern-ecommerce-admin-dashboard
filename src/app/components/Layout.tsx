import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
  pageTitle: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, pageTitle }) => {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header pageTitle={pageTitle} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
};
