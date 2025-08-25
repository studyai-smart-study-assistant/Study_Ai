
import React from 'react';
import { LoadingSkeleton } from '@/components/common';

const TeacherChatLoadingState: React.FC = () => {
  return (
    <div className="flex justify-center py-12">
      <LoadingSkeleton type="list" count={5} />
    </div>
  );
};

export default TeacherChatLoadingState;
