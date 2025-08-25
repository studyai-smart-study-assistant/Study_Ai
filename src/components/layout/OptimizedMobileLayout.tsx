
import React, { useState, useEffect, useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronUp, 
  ChevronDown,
  Smartphone,
  Tablet,
  Monitor,
  Wifi,
  WifiOff
} from 'lucide-react';

interface OptimizedMobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  collapsible?: boolean;
}

const OptimizedMobileLayout: React.FC<OptimizedMobileLayoutProps> = ({
  children,
  title,
  subtitle,
  actions,
  collapsible = false
}) => {
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    checkDevice();
    window.addEventListener('resize', checkDevice);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getDeviceIcon = useMemo(() => {
    switch (deviceType) {
      case 'mobile': return <Smartphone className="h-3 w-3" />;
      case 'tablet': return <Tablet className="h-3 w-3" />;
      default: return <Monitor className="h-3 w-3" />;
    }
  }, [deviceType]);

  const spacing = useMemo(() => ({
    padding: isMobile ? 'p-2' : 'p-4',
    margin: isMobile ? 'm-1' : 'm-3',
    gap: isMobile ? 'gap-2' : 'gap-4',
    textSize: isMobile ? 'text-sm' : 'text-base'
  }), [isMobile]);

  // Prevent auto-scroll
  useEffect(() => {
    const preventScroll = (e: Event) => {
      if (e.target === window) {
        e.preventDefault();
      }
    };
    
    window.addEventListener('scroll', preventScroll, { passive: false });
    return () => window.removeEventListener('scroll', preventScroll);
  }, []);

  return (
    <div 
      className={`min-h-screen bg-gradient-to-br from-gray-50 to-white ${spacing.padding}`}
      style={{ minHeight: '100vh', maxHeight: '100vh', overflow: 'hidden' }}
    >
      {/* Status Indicators */}
      <div className="fixed top-2 right-2 z-50 flex gap-2">
        <Badge variant="outline" className="flex items-center gap-1 bg-white/80 backdrop-blur-sm text-xs">
          {getDeviceIcon}
          <span className="capitalize">{deviceType}</span>
        </Badge>
        <Badge 
          variant={isOnline ? "default" : "destructive"} 
          className="flex items-center gap-1 bg-white/80 backdrop-blur-sm text-xs"
        >
          {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {isOnline ? 'Online' : 'Offline'}
        </Badge>
      </div>

      {/* Header */}
      {(title || subtitle || actions) && (
        <Card className={`${spacing.margin} mb-2 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 shadow-sm`}>
          <CardContent className={spacing.padding}>
            <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center justify-between'}`}>
              <div className="flex-1">
                {title && (
                  <h1 className={`font-bold text-purple-700 ${isMobile ? 'text-base' : 'text-lg'} leading-tight`}>
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className={`text-gray-600 mt-1 text-xs ${spacing.textSize} leading-relaxed`}>
                    {subtitle}
                  </p>
                )}
              </div>
              
              {actions && (
                <div className={`flex ${isMobile ? 'w-full justify-between flex-wrap gap-1' : 'gap-2'}`}>
                  {actions}
                  {collapsible && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCollapsed(!isCollapsed)}
                      className="ml-auto"
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

      {/* Main Content - with scroll prevention */}
      <div className={`${spacing.margin} ${isCollapsed ? 'hidden' : 'block'} overflow-y-auto`} style={{ maxHeight: 'calc(100vh - 200px)' }}>
        <div className={`space-y-3 ${isMobile ? 'max-w-full' : 'max-w-6xl mx-auto'}`}>
          {/* Mobile-optimized content rendering */}
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
      {isMobile && <div className="h-12"></div>}

      {/* Performance Indicator */}
      <div className="fixed bottom-2 left-2 z-50">
        <Badge variant="outline" className="bg-white/80 backdrop-blur-sm text-xs">
          {isMobile ? 'Mobile ⚡' : 'Desktop 🖥️'}
        </Badge>
      </div>
    </div>
  );
};

export default OptimizedMobileLayout;
