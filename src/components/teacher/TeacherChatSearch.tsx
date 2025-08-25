
import React from 'react';
import { Input } from "@/components/ui/input";
import { Search } from 'lucide-react';

interface TeacherChatSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const TeacherChatSearch: React.FC<TeacherChatSearchProps> = ({
  searchTerm,
  onSearchChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center mb-6">
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          className="pl-10"
          placeholder="Search teacher conversations..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
};

export default TeacherChatSearch;
