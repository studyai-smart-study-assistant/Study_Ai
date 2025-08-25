
import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Book } from 'lucide-react';
import UploadBookModal from '@/components/library/UploadBookModal';
import LibraryBottomNav from '@/components/library/LibraryBottomNav';

const UploadBook: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(true);
  
  const handleClose = () => {
    setIsUploadModalOpen(false);
    navigate('/library');
  };
  
  const handleSuccess = () => {
    navigate('/library/my-books');
  };
  
  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto pb-20">
        <div className="flex items-center gap-2">
          <Book className="h-8 w-8 text-purple-600" />
          <h1 className="text-2xl font-bold">पुस्तक अपलोड करें</h1>
        </div>
      </div>
      
      <LibraryBottomNav />
      
      <UploadBookModal 
        isOpen={isUploadModalOpen} 
        onClose={handleClose} 
        onSuccess={handleSuccess}
      />
    </PageLayout>
  );
};

export default UploadBook;
