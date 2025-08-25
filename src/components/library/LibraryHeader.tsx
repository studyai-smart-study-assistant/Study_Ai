
import React from 'react';
import { Button } from '@/components/ui/button';
import { Book, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface LibraryHeaderProps {
  onUploadClick: () => void;
  isAuthenticated: boolean;
}

const LibraryHeader: React.FC<LibraryHeaderProps> = ({ 
  onUploadClick,
  isAuthenticated
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2">
          <Book className="h-8 w-8 text-purple-600" />
          <h1 className="text-2xl font-bold">पुस्तकालय</h1>
        </div>
        
        {isAuthenticated && (
          <Button 
            onClick={onUploadClick} 
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="mr-1 h-4 w-4" />
            पुस्तक अपलोड करें
          </Button>
        )}
      </div>
      
      <div className="relative max-w-md w-full">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
        <Input 
          placeholder="पुस्तक खोजें..." 
          className="pl-10 w-full" 
        />
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
        विभिन्न विषयों पर अध्ययन सामग्री, पाठ्यपुस्तकें और नोट्स खोजें और अपलोड करें
      </p>
    </div>
  );
};

export default LibraryHeader;
