
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from 'lucide-react';
import { SubjectPlan } from '../types';

interface SubjectPlanCardProps {
  subject: SubjectPlan;
  onChapterClick: (chapter: any) => void;
}

const SubjectPlanCard: React.FC<SubjectPlanCardProps> = ({
  subject,
  onChapterClick
}) => {
  return (
    <Card className="border-purple-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {subject.subjectName}
          </CardTitle>
          <Badge className={`${
            subject.priorityLevel === 'high' ? 'bg-red-100 text-red-800' :
            subject.priorityLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {subject.priorityLevel} priority
          </Badge>
        </div>
        <p className="text-sm text-gray-600">{subject.overallStrategy}</p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {subject.chapters.slice(0, 3).map((chapter, chIndex) => (
            <div 
              key={chIndex}
              className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => onChapterClick(chapter)}
            >
              <div className="flex items-center justify-between">
                <h4 className="font-medium">
                  Chapter {chapter.chapterNumber}: {chapter.chapterName}
                </h4>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{chapter.estimatedHours}h</Badge>
                  <Badge className={`${
                    chapter.importance === 'high' ? 'bg-red-100 text-red-800' :
                    chapter.importance === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {chapter.importance}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {chapter.topics.length} topics • {chapter.practiceQuestions} questions
              </p>
            </div>
          ))}
          
          {subject.chapters.length > 3 && (
            <p className="text-sm text-gray-500 text-center">
              +{subject.chapters.length - 3} more chapters...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SubjectPlanCard;
