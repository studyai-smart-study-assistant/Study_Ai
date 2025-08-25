
import React from 'react';
import { Button } from "@/components/ui/button";
import { PlayCircle, Zap, Brain } from 'lucide-react';
import { ExamPlanData } from '../types';

interface StudyPlanActionsProps {
  onStartTracking: () => void;
  onViewStrategy?: () => void;
  onSendMessage: (msg: string) => void;
  examData: ExamPlanData;
}

const StudyPlanActions: React.FC<StudyPlanActionsProps> = ({
  onStartTracking,
  onViewStrategy,
  onSendMessage,
  examData
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      <Button 
        onClick={onStartTracking} 
        className="bg-green-600 hover:bg-green-700 flex items-center gap-2 text-xs px-3 py-2 h-9"
        size="sm"
      >
        <PlayCircle className="h-4 w-4" />
        <span className="hidden sm:inline">प्रगति ट्रैकिंग</span>
        <span className="sm:hidden">शुरू करें</span>
      </Button>
      
      {onViewStrategy && (
        <Button 
          onClick={onViewStrategy} 
          className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2 text-xs px-3 py-2 h-9"
          size="sm"
        >
          <Zap className="h-4 w-4" />
          <span className="hidden sm:inline">AI रणनीति</span>
          <span className="sm:hidden">रणनीति</span>
        </Button>
      )}
      
      <Button 
        variant="outline"
        onClick={() => onSendMessage(`मुझे ${examData.examName} की तैयारी के लिए और भी सुझाव चाहिए`)}
        className="flex items-center gap-2 text-xs px-3 py-2 h-9"
        size="sm"
      >
        <Brain className="h-4 w-4" />
        <span className="hidden sm:inline">AI सहायता</span>
        <span className="sm:hidden">सहायता</span>
      </Button>
    </div>
  );
};

export default StudyPlanActions;
