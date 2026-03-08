
import React, { useState } from 'react';
import { Search, MoreVertical, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';

interface Props {
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

const CampusTalkHeader: React.FC<Props> = ({ searchQuery, onSearchChange }) => {
  const [showSearch, setShowSearch] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="bg-[hsl(230,70%,55%)] text-white shrink-0">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold tracking-tight">Campus Talks</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <Search className="h-5 w-5" />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>
      {showSearch && (
        <div className="px-4 pb-3">
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search chats..."
            className="bg-white/20 border-0 text-white placeholder:text-white/60 focus-visible:ring-white/30"
            autoFocus
          />
        </div>
      )}
    </div>
  );
};

export default CampusTalkHeader;
