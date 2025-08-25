
import { useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  totalRenderTime: number;
  slowRenders: number;
}

export const usePerformanceMonitor = (componentName: string) => {
  const metricsRef = useRef<PerformanceMetrics>({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    totalRenderTime: 0,
    slowRenders: 0
  });
  
  const startTime = useRef<number>(performance.now());

  const logMetrics = useCallback(() => {
    if (process.env.NODE_ENV === 'development' && metricsRef.current.renderCount % 20 === 0) {
      console.log(`📊 ${componentName} Performance Summary:`, {
        totalRenders: metricsRef.current.renderCount,
        avgRenderTime: metricsRef.current.averageRenderTime.toFixed(2) + 'ms',
        lastRenderTime: metricsRef.current.lastRenderTime.toFixed(2) + 'ms',
        slowRenderCount: metricsRef.current.slowRenders,
        performanceScore: Math.round(100 - (metricsRef.current.slowRenders / metricsRef.current.renderCount * 100))
      });
    }
  }, [componentName]);

  useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;
    
    // Update metrics
    metricsRef.current.renderCount += 1;
    metricsRef.current.lastRenderTime = renderTime;
    metricsRef.current.totalRenderTime += renderTime;
    metricsRef.current.averageRenderTime = 
      metricsRef.current.totalRenderTime / metricsRef.current.renderCount;

    // Track slow renders
    if (renderTime > 16) {
      metricsRef.current.slowRenders += 1;
      
      if (process.env.NODE_ENV === 'development') {
        // Silent performance tracking for better UX
      }
    }

    // Log metrics periodically
    logMetrics();

    // Reset start time for next render
    startTime.current = performance.now();
  });

  // Return performance data for external use
  return {
    ...metricsRef.current,
    performanceScore: Math.round(100 - (metricsRef.current.slowRenders / Math.max(metricsRef.current.renderCount, 1) * 100))
  };
};

// Hook for component-level performance optimization
export const useOptimizedRender = (dependencies: any[] = []) => {
  const renderCount = useRef(0);
  const prevDeps = useRef(dependencies);
  
  useEffect(() => {
    renderCount.current += 1;
    
    // Check if dependencies actually changed
    const depsChanged = dependencies.some((dep, index) => dep !== prevDeps.current[index]);
    
    if (!depsChanged && renderCount.current > 1) {
      // Silent optimization tracking
    }
    
    prevDeps.current = dependencies;
  }, dependencies);
  
  return renderCount.current;
};
