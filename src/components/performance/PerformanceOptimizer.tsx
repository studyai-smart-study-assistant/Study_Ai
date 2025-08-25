
import React, { useEffect, useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Zap, Gauge, AlertTriangle } from 'lucide-react';

const PerformanceOptimizer: React.FC = () => {
  const [performanceScore, setPerformanceScore] = useState<number>(100);
  const [renderCount, setRenderCount] = useState<number>(0);
  const [isOptimized, setIsOptimized] = useState<boolean>(true);

  const calculatePerformanceScore = useCallback((renderTime: number, memoryUsage: number) => {
    let score = 100;
    
    // Render time penalties
    if (renderTime > 16) score -= 10; // More than 1 frame at 60fps
    if (renderTime > 50) score -= 20;
    if (renderTime > 100) score -= 30;
    
    // Memory usage penalties
    if (memoryUsage > 50) score -= 10; // Over 50MB
    if (memoryUsage > 100) score -= 20; // Over 100MB
    
    return Math.max(score, 0);
  }, []);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measurePerformance = () => {
      const now = performance.now();
      const renderTime = now - lastTime;
      frameCount++;
      
      // Update render count
      setRenderCount(prev => prev + 1);
      
      // Get memory usage if available
      let memoryUsage = 0;
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      }
      
      // Calculate performance score
      const score = calculatePerformanceScore(renderTime, memoryUsage);
      setPerformanceScore(score);
      setIsOptimized(score >= 70);
      
      lastTime = now;
      
      // Log performance warnings in development
      if (process.env.NODE_ENV === 'development' && renderTime > 16) {
        // Silent performance tracking - no warnings to users
      }
      
      requestAnimationFrame(measurePerformance);
    };

    const rafId = requestAnimationFrame(measurePerformance);

    // Cleanup large objects from memory periodically
    const cleanupInterval = setInterval(() => {
      if (window.gc) {
        window.gc();
      }
    }, 30000); // Every 30 seconds

    return () => {
      cancelAnimationFrame(rafId);
      clearInterval(cleanupInterval);
    };
  }, [calculatePerformanceScore]);

  const getScoreColor = () => {
    if (performanceScore >= 80) return 'bg-green-100 text-green-800 border-green-300';
    if (performanceScore >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const getStatusIcon = () => {
    if (performanceScore >= 80) return <Zap className="h-3 w-3" />;
    if (performanceScore >= 60) return <Gauge className="h-3 w-3" />;
    return <AlertTriangle className="h-3 w-3" />;
  };

  return (
    <div className="fixed bottom-2 sm:bottom-4 left-2 sm:left-4 z-50 flex flex-col gap-1">
      <Badge 
        variant="outline" 
        className={`${getScoreColor()} text-xs px-2 py-1 flex items-center gap-1 backdrop-blur-sm`}
      >
        {getStatusIcon()}
        <span className="hidden sm:inline">Performance: {performanceScore}%</span>
        <span className="sm:hidden">{performanceScore}%</span>
      </Badge>
      
      {process.env.NODE_ENV === 'development' && (
        <Badge 
          variant="outline"
          className="bg-gray-100 text-gray-800 text-xs px-2 py-1 backdrop-blur-sm"
        >
          <span className="hidden sm:inline">Renders: {renderCount}</span>
          <span className="sm:hidden">R: {renderCount}</span>
        </Badge>
      )}
    </div>
  );
};

export default PerformanceOptimizer;
