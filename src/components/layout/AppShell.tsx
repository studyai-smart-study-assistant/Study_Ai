import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Animation settings for page transitions
const pageVariants = {
  initial: {
    opacity: 0,
    y: 10, // Start slightly below
  },
  in: {
    opacity: 1,
    y: 0, // Animate to original position
  },
  out: {
    opacity: 0,
    y: -10, // Exit upwards
  },
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.3, // A quick transition
};

/**
 * Persistent App Shell - mounts only ONCE
 * Manages page transitions and preserves scroll position.
 */
const AppShell: React.FC = () => {
  const { pathname } = useLocation();

  // Preserve scroll position per route by scrolling to top on new page
  useEffect(() => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.scrollTop = 0;
    }
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main Content Area - this is where pages render */}
      <main 
        id="main-content" 
        className="flex-1 overflow-y-auto overflow-x-hidden" // overflow-x-hidden to prevent scrollbars during animation
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname} // Unique key triggers animation on route change
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default AppShell;
