
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface LoadingOptimizerProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  delay?: number;
}

const LoadingOptimizer: React.FC<LoadingOptimizerProps> = ({ 
  children, 
  fallback,
  delay = 100 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  if (!isVisible) {
    return fallback || (
      <Card className="animate-pulse">
        <CardContent className="p-4">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
};

export default LoadingOptimizer;
