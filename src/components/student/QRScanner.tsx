
import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScanLine } from 'lucide-react';
import QRUploadTab from './qr-scanner/QRUploadTab';
import QRCameraTab from './qr-scanner/QRCameraTab';
import ScanResult from './qr-scanner/ScanResult';
import { useQRScanner } from './qr-scanner/useQRScanner';

interface QRScannerProps {
  currentUser: any;
}

const QRScanner: React.FC<QRScannerProps> = ({ currentUser }) => {
  const {
    scanResult,
    isDialogOpen,
    isLoading,
    setIsDialogOpen,
    handleFileUpload,
    resetScan
  } = useQRScanner(currentUser);
  
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2 border-purple-200 dark:border-purple-800"
        >
          <ScanLine className="h-4 w-4" />
          QR स्कैन करें
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>स्टूडेंट QR कोड स्कैन करें</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!scanResult ? (
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">अपलोड करें</TabsTrigger>
                <TabsTrigger value="camera" disabled>कैमरा</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="pt-4">
                <QRUploadTab 
                  handleFileUpload={handleFileUpload}
                  isLoading={isLoading}
                />
              </TabsContent>
              
              <TabsContent value="camera" className="pt-4">
                <QRCameraTab />
              </TabsContent>
            </Tabs>
          ) : (
            <ScanResult 
              scanResult={scanResult} 
              resetScan={resetScan} 
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRScanner;
