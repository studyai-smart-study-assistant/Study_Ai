
import React, { Suspense } from 'react';
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// Lazy load the optimized chat container
const PerformanceOptimizedChatContainer = React.lazy(() => import('./chat/PerformanceOptimizedChatContainer'));

interface ChatProps {
  chatId: string;
  onChatUpdated?: () => void;
}

const ChatOptimized: React.FC<ChatProps> = ({ chatId, onChatUpdated }) => {
  if (!chatId) {
    return (
      <Card className="flex-1 flex items-center justify-center p-8">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            कोई chat selected नहीं है। नया chat शुरू करें या existing chat select करें।
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="text-sm text-gray-600">Chat loading...</p>
          </div>
        </div>
      }>
        <PerformanceOptimizedChatContainer 
          chatId={chatId} 
          onChatUpdated={onChatUpdated} 
        />
      </Suspense>
    </div>
  );
};

export default React.memo(ChatOptimized);
