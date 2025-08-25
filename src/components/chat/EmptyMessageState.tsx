
import React from 'react';
import { MessageCircle } from 'lucide-react';

const EmptyMessageState: React.FC = () => {
  return (
    <div className="flex h-full items-center justify-center text-gray-500 flex-col space-y-4">
      <MessageCircle className="h-16 w-16 text-gray-300" />
      <p className="text-center max-w-xs">
        अभी तक कोई संदेश नहीं। बातचीत शुरू करने के लिए एक संदेश भेजें।
      </p>
    </div>
  );
};

export default EmptyMessageState;
