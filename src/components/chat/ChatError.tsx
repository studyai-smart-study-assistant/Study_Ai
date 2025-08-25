
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2 } from 'lucide-react';

interface ChatErrorProps {
  onBack: () => void;
  error: string;
}

const ChatError: React.FC<ChatErrorProps> = ({ onBack, error }) => {
  return (
    <div className="flex flex-col h-full glass-morphism border border-purple-200 dark:border-purple-900">
      <div className="flex items-center p-3 border-b bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-gray-900">
        <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="font-semibold text-lg">Chat Error</h2>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <div className="rounded-full bg-red-100 p-3 mb-4">
          <Trash2 className="h-6 w-6 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Could not load chat</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <Button onClick={onBack}>Return to Chat List</Button>
      </div>
    </div>
  );
};

export default ChatError;
