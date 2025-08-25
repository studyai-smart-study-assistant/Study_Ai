
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Globe } from 'lucide-react';

const QRCameraTab: React.FC = () => {
  return (
    <Card className="border-dashed border-2 border-gray-300">
      <CardContent className="text-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-gray-100 rounded-full">
            <Camera className="h-8 w-8 text-gray-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-gray-700">Camera Scanner</h3>
            <p className="text-sm text-gray-500 max-w-xs">
              यह web application है, camera access limited है। 
              QR codes को upload करके scan करें।
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <Badge variant="outline" className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                Web App
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QRCameraTab;
