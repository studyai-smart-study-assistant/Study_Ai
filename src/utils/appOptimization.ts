
// App-wide performance optimizations

export class AppOptimizer {
  private static instance: AppOptimizer;
  private isInitialized = false;

  static getInstance(): AppOptimizer {
    if (!AppOptimizer.instance) {
      AppOptimizer.instance = new AppOptimizer();
    }
    return AppOptimizer.instance;
  }

  init() {
    if (this.isInitialized) return;

    this.optimizeScrolling();
    this.optimizeImages();
    this.optimizeAnimations();
    this.preventMemoryLeaks();
    this.fixDropdownIssues();
    
    this.isInitialized = true;
    console.log('✅ App optimization initialized');
  }

  private optimizeScrolling() {
    // Smooth scrolling for better UX
    document.documentElement.style.scrollBehavior = 'smooth';

    // Optimize scroll events
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          // Scroll optimizations here
          ticking = false;
        });
        ticking = true;
      }
    };

    document.addEventListener('scroll', handleScroll, { passive: true });
  }

  private optimizeImages() {
    // Add loading optimization to all images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      img.loading = 'lazy';
      img.decoding = 'async';
      
      // Add error handling
      img.onerror = () => {
        img.src = '/placeholder.svg';
      };
    });
  }

  private optimizeAnimations() {
    // Reduce animations on low-end devices
    const isLowEndDevice = navigator.hardwareConcurrency <= 2;
    
    if (isLowEndDevice) {
      const style = document.createElement('style');
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0.1s !important;
          animation-delay: 0s !important;
          transition-duration: 0.1s !important;
          transition-delay: 0s !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  private preventMemoryLeaks() {
    // Clean up intervals and timeouts
    const originalSetInterval = window.setInterval;
    const originalSetTimeout = window.setTimeout;
    const intervals: number[] = [];
    const timeouts: number[] = [];

    window.setInterval = ((callback: any, ms: number) => {
      const id = originalSetInterval(callback, ms);
      intervals.push(id);
      return id;
    }) as any;

    window.setTimeout = ((callback: any, ms: number) => {
      const id = originalSetTimeout(callback, ms);
      timeouts.push(id);
      return id;
    }) as any;

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      intervals.forEach(id => clearInterval(id));
      timeouts.forEach(id => clearTimeout(id));
    });
  }

  private fixDropdownIssues() {
    // Fix dropdown z-index and visibility issues
    const style = document.createElement('style');
    style.textContent = `
      /* Fix dropdown issues */
      [data-radix-popper-content-wrapper] {
        z-index: 9999 !important;
      }
      
      .dropdown-content,
      [role="menu"],
      [role="listbox"] {
        z-index: 9999 !important;
        background: white !important;
        border: 1px solid #e2e8f0 !important;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
      }

      /* Fix loading states */
      .loading-skeleton {
        animation: pulse 1.5s ease-in-out infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      /* Optimize text rendering */
      body {
        text-rendering: optimizeSpeed;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
    `;
    document.head.appendChild(style);
  }

  // Fix specific app issues
  fixLoginPageIssues() {
    // Ensure login forms load properly
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      form.style.minHeight = 'auto';
      form.style.visibility = 'visible';
    });
  }

  optimizeForStudents() {
    // Student-specific optimizations
    
    // Disable right-click during exams/tests
    const isTestMode = window.location.pathname.includes('quiz') || 
                      window.location.pathname.includes('test');
    
    if (isTestMode) {
      document.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    // Focus mode for better concentration
    if (window.location.pathname.includes('study')) {
      document.body.classList.add('focus-mode');
    }
  }
}

// Auto-initialize
export const initializeAppOptimizations = () => {
  const optimizer = AppOptimizer.getInstance();
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => optimizer.init());
  } else {
    optimizer.init();
  }
  
  return optimizer;
};
