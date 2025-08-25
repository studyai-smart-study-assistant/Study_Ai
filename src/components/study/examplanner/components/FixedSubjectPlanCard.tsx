
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, Target } from 'lucide-react';
import { SubjectPlan, ChapterInfo } from '../types';

interface FixedSubjectPlanCardProps {
  subject: SubjectPlan;
  onChapterClick: (chapter: ChapterInfo) => void;
}

const FixedSubjectPlanCard: React.FC<FixedSubjectPlanCardProps> = ({
  subject,
  onChapterClick
}) => {
  const getPriorityColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high': return 'bg-red-50 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default: return 'bg-green-50 text-green-700 border-green-200';
    }
  };

  return (
    <Card className="border-purple-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-purple-600" />
            {subject.subjectName}
          </CardTitle>
          <Badge className={getPriorityColor(subject.priorityLevel)}>
            {subject.priorityLevel === 'high' ? 'उच्च' : 
             subject.priorityLevel === 'medium' ? 'मध्यम' : 'कम'} प्राथमिकता
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mt-2">{subject.overallStrategy}</p>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2">
          {subject.chapters.slice(0, 3).map((chapter, chIndex) => (
            <div 
              key={chIndex}
              className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200"
              onClick={() => onChapterClick(chapter)}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm">
                  अध्याय {chapter.chapterNumber}: {chapter.chapterName}
                </h4>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {chapter.estimatedHours}घं
                  </Badge>
                  <Badge className={`text-xs ${getImportanceColor(chapter.importance)}`}>
                    <Target className="h-3 w-3 mr-1" />
                    {chapter.importance === 'high' ? 'उच्च' : 
                     chapter.importance === 'medium' ? 'मध्यम' : 'कम'}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{chapter.topics.length} विषय</span>
                <span>{chapter.practiceQuestions} प्रश्न</span>
              </div>
            </div>
          ))}
          
          {subject.chapters.length > 3 && (
            <div className="text-center py-2">
              <Badge variant="outline" className="text-xs">
                +{subject.chapters.length - 3} और अध्याय...
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FixedSubjectPlanCard;
