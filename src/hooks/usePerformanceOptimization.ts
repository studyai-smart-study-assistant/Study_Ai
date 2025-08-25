
import { useEffect, useCallback, useRef } from 'react';

interface UsePerformanceOptimizationOptions {
  enableVirtualization?: boolean;
  debounceMs?: number;
  throttleMs?: number;
}

export const usePerformanceOptimization = (options: UsePerformanceOptimizationOptions = {}) => {
  const {
    enableVirtualization = false,
    debounceMs = 300,
    throttleMs = 100
  } = options;

  const timeoutRef = useRef<NodeJS.Timeout>();
  const throttleRef = useRef<number>(0);

  // Debounced function
  const debounce = useCallback((func: Function, delay: number = debounceMs) => {
    return (...args: any[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => func(...args), delay);
    };
  }, [debounceMs]);

  // Throttled function
  const throttle = useCallback((func: Function, delay: number = throttleMs) => {
    return (...args: any[]) => {
      const now = Date.now();
      if (now - throttleRef.current >= delay) {
        func(...args);
        throttleRef.current = now;
      }
    };
  }, [throttleMs]);

  // Optimize DOM operations
  const batchDOMUpdates = useCallback((updates: (() => void)[]) => {
    requestAnimationFrame(() => {
      updates.forEach(update => update());
    });
  }, []);

  // Memory cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Performance monitoring
  const measurePerformance = useCallback((name: string, fn: Function) => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    if (end - start > 16) { // Longer than one frame
      console.warn(`Slow operation detected: ${name} took ${end - start}ms`);
    }
    
    return result;
  }, []);

  return {
    debounce,
    throttle,
    batchDOMUpdates,
    measurePerformance
  };
};

export default usePerformanceOptimization;
