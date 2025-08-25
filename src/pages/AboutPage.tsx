
import React from 'react';
import About from '@/components/about/About';
import Sidebar from '@/components/Sidebar';
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState } from 'react';

const AboutPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  
  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-900">
      <Sidebar 
        isOpen={isSidebarOpen || !isMobile}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isMobile && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu">
                  <line x1="4" x2="20" y1="12" y2="12"/>
                  <line x1="4" x2="20" y1="6" y2="6"/>
                  <line x1="4" x2="20" y1="18" y2="18"/>
                </svg>
              </Button>
            )}
            <h1 className="font-semibold text-lg">About Study AI</h1>
          </div>
          
          <Button variant="ghost" size="icon" asChild>
            <a href="/">
              <X className="h-5 w-5" />
            </a>
          </Button>
        </div>
        
        <div className="flex-1 overflow-auto">
          <About />
        </div>
      </main>
    </div>
  );
};

export default AboutPage;
