
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Brain, Sparkles } from 'lucide-react';

interface PlannerHeaderProps {
  isGenerating: boolean;
  planProgress: number;
}

const PlannerHeader: React.FC<PlannerHeaderProps> = ({ isGenerating, planProgress }) => {
  if (!isGenerating) return null;

  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <Brain className="h-6 w-6 text-blue-600 animate-pulse" />
            <Sparkles className="h-3 w-3 text-yellow-500 absolute -top-1 -right-1 animate-bounce" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-800 text-sm">AI Teacher Working...</h3>
            <p className="text-xs text-blue-600">आपकी व्यक्तिगत योजना बनाई जा रही है</p>
          </div>
        </div>
        <div className="space-y-2">
          <Progress value={planProgress} className="h-2" />
          <p className="text-xs text-center text-blue-700">{planProgress}% Complete</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlannerHeader;
