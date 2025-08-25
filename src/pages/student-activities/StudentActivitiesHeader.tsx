
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft, QrCode } from 'lucide-react';
import QRScanner from '@/components/student/QRScanner';

interface StudentActivitiesHeaderProps {
  currentUser: any;
  onOpenQRDialog: () => void;
}

const StudentActivitiesHeader: React.FC<StudentActivitiesHeaderProps> = ({
  currentUser,
  onOpenQRDialog,
}) => {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(-1)}
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">अध्ययन गतिविधियां</h1>
      </div>
      <div className="flex items-center gap-2">
        <QRScanner currentUser={currentUser} />
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2 border-purple-200 dark:border-purple-800"
          onClick={onOpenQRDialog}
        >
          <QrCode className="h-4 w-4" />
          <span className="hidden sm:inline">मेरा QR कोड</span>
        </Button>
      </div>
    </div>
  );
};

export default StudentActivitiesHeader;

