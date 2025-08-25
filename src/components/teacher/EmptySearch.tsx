
import React from 'react';
import { Button } from "@/components/ui/button";
import { School } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EmptySearchProps {
  searchTerm: string;
}

const EmptySearch: React.FC<EmptySearchProps> = ({ searchTerm }) => {
  const navigate = useNavigate();
  
  return (
    <div className="text-center py-12">
      <School className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
      <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">
        No teacher conversations found
      </h3>
      <p className="text-gray-400 dark:text-gray-500 mt-2">
        {searchTerm ? "Try a different search term" : "Start a conversation with a teacher to see it here"}
      </p>
      <Button
        variant="outline"
        className="mt-4"
        onClick={() => navigate('/')}
      >
        Start a Teacher Chat
      </Button>
    </div>
  );
};

export default EmptySearch;
