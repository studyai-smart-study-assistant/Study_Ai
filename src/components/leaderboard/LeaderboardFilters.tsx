
import React from 'react';
import { Search, Filter, Calendar, ArrowUpDown, Star, Flame, Clock } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface LeaderboardFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  timeFilter: 'all' | 'week' | 'month' | 'today';
  setTimeFilter: (filter: 'all' | 'week' | 'month' | 'today') => void;
  sortBy: 'xp' | 'streakDays' | 'studyHours';
  setSortBy: (sortBy: 'xp' | 'streakDays' | 'studyHours') => void;
}

const LeaderboardFilters: React.FC<LeaderboardFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  timeFilter,
  setTimeFilter,
  sortBy,
  setSortBy
}) => {
  const getTimeFilterLabel = () => {
    switch (timeFilter) {
      case 'today': return 'आज';
      case 'week': return 'इस सप्ताह';
      case 'month': return 'इस महीने';
      default: return 'सभी समय';
    }
  };
  
  const getSortByLabel = () => {
    switch (sortBy) {
      case 'streakDays': return 'स्ट्रीक दिन';
      case 'studyHours': return 'अध्ययन घंटे';
      default: return 'XP पॉइंट्स';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="उपयोगकर्ता खोजें..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-1">
              <Filter className="h-4 w-4 mr-1" />
              {getTimeFilterLabel()}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setTimeFilter('all')}>
              <Calendar className="h-4 w-4 mr-2" />
              सभी समय
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTimeFilter('today')}>
              <Calendar className="h-4 w-4 mr-2" />
              आज
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTimeFilter('week')}>
              <Calendar className="h-4 w-4 mr-2" />
              इस सप्ताह
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTimeFilter('month')}>
              <Calendar className="h-4 w-4 mr-2" />
              इस महीने
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-1">
              <ArrowUpDown className="h-4 w-4 mr-1" />
              {getSortByLabel()}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setSortBy('xp')}>
              <Star className="h-4 w-4 mr-2" />
              XP पॉइंट्स
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('streakDays')}>
              <Flame className="h-4 w-4 mr-2" />
              स्ट्रीक दिन
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('studyHours')}>
              <Clock className="h-4 w-4 mr-2" />
              अध्ययन घंटे
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default LeaderboardFilters;
