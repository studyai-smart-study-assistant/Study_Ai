
import React from 'react';
import { Book } from '@/types/library';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Download, Heart, ExternalLink, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { incrementDownload, likeBook } from '@/lib/supabase/library-functions';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { hi } from 'date-fns/locale';

interface BookCardProps { book: Book; }

const BookCard: React.FC<BookCardProps> = ({ book }) => {
  const handleLike = async () => { try { await likeBook(book.id); toast.success("पुस्तक को सराहा गया!"); } catch { toast.error("लाइक करने में समस्या"); } };
  const handleDownload = async () => { try { if (!book.fileUrl) return toast.error("डाउनलोड लिंक उपलब्ध नहीं"); await incrementDownload(book.id); window.open(book.fileUrl, '_blank'); toast.success("पुस्तक डाउनलोड हो रही है"); } catch { toast.error("डाउनलोड में समस्या"); } };
  const handleExternalLink = () => { if (book.externalLink) window.open(book.externalLink, '_blank'); else toast.error("बाहरी लिंक उपलब्ध नहीं"); };
  const getUploadDate = () => book.uploadedAt instanceof Date ? book.uploadedAt : new Date(book.uploadedAt as any);
  const timeAgo = formatDistanceToNow(getUploadDate(), { addSuffix: true, locale: hi });

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md h-full flex flex-col">
      <div className="relative pb-[60%] bg-purple-50 overflow-hidden">
        {book.coverImageUrl ? <img src={book.coverImageUrl} alt={book.title} className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-100 to-indigo-50"><FileText className="h-16 w-16 text-purple-400" /></div>}
      </div>
      <CardHeader className="p-4 pb-2"><h3 className="font-medium line-clamp-2">{book.title}</h3><p className="text-sm text-gray-600">{book.author}</p></CardHeader>
      <CardContent className="p-4 pt-0 pb-2 flex-grow"><p className="text-sm text-gray-500 line-clamp-2">{book.description}</p><div className="flex items-center gap-1 mt-2"><span className="inline-flex items-center px-2 py-1 rounded-full bg-purple-100 text-purple-800 text-xs">{book.category}</span><span className="text-xs text-gray-500">{timeAgo}</span></div></CardContent>
      <CardFooter className="p-4 pt-2 flex justify-between">
        <div className="flex items-center gap-1"><Button variant="ghost" size="icon" onClick={handleLike}><Heart className="h-4 w-4 text-gray-600 hover:text-red-500" /></Button><span className="text-xs">{book.likes}</span></div>
        <div className="flex gap-1">{book.fileUrl && <Button variant="ghost" size="icon" onClick={handleDownload}><Download className="h-4 w-4" /></Button>}{book.externalLink && <Button variant="ghost" size="icon" onClick={handleExternalLink}><ExternalLink className="h-4 w-4" /></Button>}</div>
      </CardFooter>
    </Card>
  );
};

export default BookCard;
