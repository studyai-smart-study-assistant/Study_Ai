
import React, { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Menu, 
  X, 
  ChevronUp, 
  ChevronDown,
  Smartphone,
  Tablet,
  Monitor
} from 'lucide-react';

interface MobileOptimizedLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  collapsible?: boolean;
}

const MobileOptimizedLayout: React.FC<MobileOptimizedLayoutProps> = ({
  children,
  title,
  subtitle,
  actions,
  collapsible = false
}) => {
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const getDeviceIcon = () => {
    switch (deviceType) {
      case 'mobile': return <Smartphone className="h-3 w-3" />;
      case 'tablet': return <Tablet className="h-3 w-3" />;
      default: return <Monitor className="h-3 w-3" />;
    }
  };

  const getOptimizedSpacing = () => {
    return {
      padding: isMobile ? 'p-2' : 'p-4',
      margin: isMobile ? 'm-1' : 'm-2',
      gap: isMobile ? 'gap-2' : 'gap-4',
      textSize: isMobile ? 'text-sm' : 'text-base'
    };
  };

  const spacing = getOptimizedSpacing();

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-white ${spacing.padding}`}>
      {/* Device Indicator */}
      <div className="fixed top-2 right-2 z-50">
        <Badge variant="outline" className="flex items-center gap-1 bg-white/80 backdrop-blur-sm text-xs">
          {getDeviceIcon()}
          <span className="capitalize">{deviceType}</span>
        </Badge>
      </div>

      {/* Header */}
      {(title || subtitle || actions) && (
        <Card className={`${spacing.margin} mb-2 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50`}>
          <CardContent className={spacing.padding}>
            <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center justify-between'}`}>
              <div className="flex-1">
                {title && (
                  <h1 className={`font-bold text-purple-700 ${isMobile ? 'text-base' : 'text-lg'}`}>
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className={`text-gray-600 mt-1 text-xs ${spacing.textSize}`}>
                    {subtitle}
                  </p>
                )}
              </div>
              
              {actions && (
                <div className={`flex ${isMobile ? 'w-full justify-between' : 'gap-2'}`}>
                  {actions}
                  {collapsible && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCollapsed(!isCollapsed)}
                      className="ml-2"
                    >
                      {isCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className={`${spacing.margin} ${isCollapsed ? 'hidden' : 'block'}`}>
        <div className={`space-y-3 ${isMobile ? 'max-w-full' : 'max-w-6xl mx-auto'}`}>
          {/* Mobile-specific optimizations */}
          {isMobile ? (
            <div className="space-y-2">
              {React.Children.map(children, (child, index) => (
                <div key={index} className="w-full">
                  {child}
                </div>
              ))}
            </div>
          ) : (
            children
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation Spacer */}
      {isMobile && (
        <div className="h-16"></div>
      )}

      {/* Performance Indicator */}
      <div className="fixed bottom-2 left-2 z-50">
        <Badge variant="outline" className="bg-white/80 backdrop-blur-sm text-xs">
          {isMobile ? 'Mobile Optimized' : 'Desktop View'}
        </Badge>
      </div>
    </div>
  );
};

export default MobileOptimizedLayout;
