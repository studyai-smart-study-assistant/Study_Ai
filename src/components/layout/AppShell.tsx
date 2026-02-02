import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { prefetchRoutes } from '@/lib/route-prefetch';

/**
 * Persistent App Shell - mounts only ONCE
 * Header/Footer remain static, only content changes via <Outlet />
 */
const AppShell: React.FC = () => {
  const location = useLocation();

  // Prefetch routes on first load
  useEffect(() => {
    // Small delay to not block initial render
    const timer = setTimeout(() => {
      prefetchRoutes();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Preserve scroll position per route
  useEffect(() => {
    // Only scroll to top for major navigation, not internal state changes
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.scrollTop = 0;
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main Content Area - this is where pages render */}
      <main 
        id="main-content" 
        className="flex-1 overflow-y-auto"
      >
        <Outlet />
      </main>
    </div>
  );
};

export default AppShell;
