
import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getUserBooks } from '@/lib/firebase/library';
import BooksList from '@/components/library/BooksList';
import LibraryBottomNav from '@/components/library/LibraryBottomNav';
import { Book, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UploadBookModal from '@/components/library/UploadBookModal';

const MyBooks: React.FC = () => {
  const { currentUser } = useAuth();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  const { 
    data: myBooks, 
    isLoading,
    refetch: refetchMyBooks
  } = useQuery({
    queryKey: ['myBooks', currentUser?.uid],
    queryFn: () => getUserBooks(),
    enabled: !!currentUser,
  });

  const handleBookUploaded = () => {
    refetchMyBooks();
  };

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto pb-24">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-2">
              <Book className="h-8 w-8 text-purple-600" />
              <h1 className="text-2xl font-bold">मेरी पुस्तकें</h1>
            </div>
            
            <Button 
              onClick={() => setIsUploadModalOpen(true)} 
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="mr-1 h-4 w-4" />
              पुस्तक अपलोड करें
            </Button>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            आपके द्वारा अपलोड की गई पुस्तकों का प्रबंधन करें
          </p>
        </div>
        
        <div className="mt-8">
          <BooksList 
            books={myBooks || []} 
            isLoading={isLoading} 
          />
        </div>
      </div>
      
      <LibraryBottomNav />
      
      <UploadBookModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        onSuccess={handleBookUploaded}
      />
    </PageLayout>
  );
};

export default MyBooks;
