
import React from 'react';
import { Book } from '@/types/library';
import { Skeleton } from '@/components/ui/skeleton';
import BookCard from './BookCard';
import { BookOpen } from 'lucide-react';

interface BooksListProps {
  books: Book[];
  isLoading: boolean;
}

const BooksList: React.FC<BooksListProps> = ({ books, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="w-full h-40 rounded-lg" />
            <Skeleton className="w-3/4 h-6 rounded" />
            <Skeleton className="w-1/2 h-4 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!books || books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <BookOpen className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-medium text-gray-600">कोई पुस्तक नहीं मिली</h3>
        <p className="text-gray-500 mt-2 max-w-md">
          इस श्रेणी में अभी कोई पुस्तक उपलब्ध नहीं है। पुस्तक अपलोड बटन का उपयोग करके अपनी पहली पुस्तक अपलोड करें।
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
};

export default BooksList;
