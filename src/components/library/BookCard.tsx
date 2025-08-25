import React from 'react';
import { Book } from '@/types/library';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Download, Heart, ExternalLink, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { incrementDownload, likeBook } from '@/lib/firebase/library';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { hi } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';

interface BookCardProps {
  book: Book;
}

const BookCard: React.FC<BookCardProps> = ({ book }) => {
  const handleLike = async () => {
    try {
      await likeBook(book.id);
      toast.success("पुस्तक को सराहा गया!");
    } catch (error) {
      toast.error("लाइक करने में समस्या हुई");
    }
  };

  const handleDownload = async () => {
    try {
      if (!book.fileUrl) {
        toast.error("डाउनलोड लिंक उपलब्ध नहीं है");
        return;
      }
      
      await incrementDownload(book.id);
      
      // डाउनलोड लिंक खोलें
      window.open(book.fileUrl, '_blank');
      toast.success("पुस्तक डाउनलोड हो रही है");
    } catch (error) {
      toast.error("डाउनलोड में समस्या हुई");
    }
  };

  const handleExternalLink = () => {
    if (!book.externalLink) {
      toast.error("बाहरी लिंक उपलब्ध नहीं है");
      return;
    }
    
    window.open(book.externalLink, '_blank');
  };

  // Updated timestamp handling
  const getUploadDate = () => {
    if (book.uploadedAt instanceof Date) {
      return book.uploadedAt;
    } else if (typeof book.uploadedAt === 'string') {
      return new Date(book.uploadedAt);
    } else if (book.uploadedAt && typeof (book.uploadedAt as Timestamp).toDate === 'function') {
      // Handle Firebase Timestamp
      return (book.uploadedAt as Timestamp).toDate();
    }
    return new Date();
  };

  const timeAgo = formatDistanceToNow(getUploadDate(), { 
    addSuffix: true,
    locale: hi
  });

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md h-full flex flex-col">
      <div className="relative pb-[60%] bg-purple-50 overflow-hidden">
        {book.coverImageUrl ? (
          <img 
            src={book.coverImageUrl} 
            alt={book.title} 
            className="absolute inset-0 w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-100 to-indigo-50 dark:from-purple-950 dark:to-indigo-900">
            <FileText className="h-16 w-16 text-purple-400" />
          </div>
        )}
      </div>
      
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-medium line-clamp-2">{book.title}</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{book.author}</p>
      </CardHeader>
      
      <CardContent className="p-4 pt-0 pb-2 flex-grow">
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{book.description}</p>
        
        <div className="flex items-center gap-1 mt-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs">
            {book.category}
          </span>
          <span className="text-xs text-gray-500">{timeAgo}</span>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-2 flex justify-between">
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleLike} 
            title="लाइक करें"
          >
            <Heart className="h-4 w-4 text-gray-600 hover:text-red-500" />
          </Button>
          <span className="text-xs text-gray-600">{book.likes}</span>
        </div>
        
        <div className="flex gap-1">
          {book.fileUrl && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleDownload}
              title="डाउनलोड करें"
            >
              <Download className="h-4 w-4 text-gray-600 hover:text-blue-500" />
            </Button>
          )}
          
          {book.externalLink && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleExternalLink}
              title="बाहरी लिंक"
            >
              <ExternalLink className="h-4 w-4 text-gray-600 hover:text-blue-500" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default BookCard;
