
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload } from 'lucide-react';

interface QRUploadTabProps {
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
}

const QRUploadTab: React.FC<QRUploadTabProps> = ({ handleFileUpload, isLoading }) => {
  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
        <Upload className="h-8 w-8 mx-auto mb-4 text-gray-400" />
        <p className="text-sm text-gray-500 mb-4">QR कोड की इमेज अपलोड करें</p>
        <div className="space-y-2">
          <Label htmlFor="qr-file-input">QR इमेज चुनें</Label>
          <Input 
            id="qr-file-input" 
            type="file" 
            accept="image/*" 
            onChange={handleFileUpload} 
          />
        </div>
      </div>
      
      {isLoading && (
        <div className="flex justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
        </div>
      )}
    </div>
  );
};

export default QRUploadTab;
