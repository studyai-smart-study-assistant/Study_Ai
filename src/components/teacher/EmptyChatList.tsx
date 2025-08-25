
import React from 'react';
import { School } from 'lucide-react';
import { Button } from "@/components/ui/button";

export const EmptyChatList: React.FC = () => (
  <div className="text-center py-12">
    <School className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
    <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">
      No teacher conversations found
    </h3>
    <p className="text-gray-400 dark:text-gray-500 mt-2">
      Start a conversation with a teacher to see it here
    </p>
    <Button
      variant="outline"
      className="mt-4"
      onClick={() => window.location.href = '/'}
    >
      Start a Teacher Chat
    </Button>
  </div>
);
