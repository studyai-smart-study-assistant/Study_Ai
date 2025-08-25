
import React from 'react';

interface PageLayoutProps {
  children: React.ReactNode;
}

export const PageLayout: React.FC<PageLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white to-purple-50 dark:from-gray-900 dark:to-purple-950/30 overflow-y-auto">
      <div className="container mx-auto py-6">
        {children}
      </div>
    </div>
  );
};
