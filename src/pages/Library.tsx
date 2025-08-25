
import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import LibraryHeader from '@/components/library/LibraryHeader';
import LibraryCategories from '@/components/library/LibraryCategories';
import BooksList from '@/components/library/BooksList';
import UploadBookModal from '@/components/library/UploadBookModal';
import LibraryBottomNav from '@/components/library/LibraryBottomNav';
import { useQuery } from '@tanstack/react-query';
import { getPublicBooks, getBooksByCategory, getPopularBooks } from '@/lib/firebase/library';
import { BookCategory } from '@/types/library';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';

const Library: React.FC = () => {
  const { currentUser } = useAuth();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<BookCategory | 'all' | 'popular'>('all');
  const [activeTab, setActiveTab] = useState<string>('all');

  const { 
    data: allBooks, 
    isLoading: isAllBooksLoading,
    refetch: refetchAllBooks
  } = useQuery({
    queryKey: ['books', 'all'],
    queryFn: () => getPublicBooks(),
  });

  const {
    data: popularBooks,
    isLoading: isPopularBooksLoading
  } = useQuery({
    queryKey: ['books', 'popular'],
    queryFn: () => getPopularBooks(),
  });

  const {
    data: categoryBooks,
    isLoading: isCategoryBooksLoading,
    refetch: refetchCategoryBooks
  } = useQuery({
    queryKey: ['books', 'category', selectedCategory],
    queryFn: () => getBooksByCategory(selectedCategory as string),
    enabled: selectedCategory !== 'all' && selectedCategory !== 'popular',
  });

  const handleCategoryChange = (category: BookCategory | 'all' | 'popular') => {
    setSelectedCategory(category);
    setActiveTab(category);
  };

  const handleBookUploaded = () => {
    refetchAllBooks();
    refetchCategoryBooks();
  };

  const getDisplayBooks = () => {
    if (selectedCategory === 'all') return allBooks || [];
    if (selectedCategory === 'popular') return popularBooks || [];
    return categoryBooks || [];
  };

  const isLoading = isAllBooksLoading || isPopularBooksLoading || isCategoryBooksLoading;

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto pb-24">
        <LibraryHeader 
          onUploadClick={() => setIsUploadModalOpen(true)} 
          isAuthenticated={!!currentUser}
        />
        
        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <ScrollArea className="w-full">
              <div className="pb-4">
                <TabsList className="bg-transparent h-auto p-0 w-full flex flex-nowrap overflow-x-auto">
                  <TabsTrigger 
                    value="all" 
                    className="px-4 py-2 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-800 dark:data-[state=active]:bg-purple-950 dark:data-[state=active]:text-purple-200 rounded-md"
                    onClick={() => handleCategoryChange('all')}
                  >
                    सभी पुस्तकें
                  </TabsTrigger>
                  <TabsTrigger 
                    value="popular" 
                    className="px-4 py-2 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-800 dark:data-[state=active]:bg-purple-950 dark:data-[state=active]:text-purple-200 rounded-md"
                    onClick={() => handleCategoryChange('popular')}
                  >
                    लोकप्रिय
                  </TabsTrigger>
                  <LibraryCategories 
                    onSelectCategory={handleCategoryChange} 
                    activeCategory={selectedCategory} 
                  />
                </TabsList>
              </div>
            </ScrollArea>
            
            <TabsContent value={activeTab} className="mt-6">
              <BooksList 
                books={getDisplayBooks()} 
                isLoading={isLoading} 
              />
            </TabsContent>
          </Tabs>
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

export default Library;
