
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Target, Trophy } from 'lucide-react';
import { ChapterInfo } from './types';
import TopicCard from './components/TopicCard';

interface DetailedChapterViewProps {
  chapter: ChapterInfo;
  onTopicComplete: (topicName: string, feedback: any) => void;
  completedTopics: string[];
}

const DetailedChapterView: React.FC<DetailedChapterViewProps> = ({
  chapter,
  onTopicComplete,
  completedTopics
}) => {
  return (
    <div className="space-y-6">
      {/* Chapter Header */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-blue-800">
                Chapter {chapter.chapterNumber}: {chapter.chapterName}
              </CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={`${
                  chapter.importance === 'high' ? 'bg-red-100 text-red-800' :
                  chapter.importance === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {chapter.importance} priority
                </Badge>
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  {chapter.estimatedHours}h total
                </Badge>
                <Badge variant="outline">
                  <Target className="h-3 w-3 mr-1" />
                  {chapter.topics.length} topics
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {completedTopics.filter(topic => 
                  chapter.topics.some(t => t.topicName === topic)
                ).length}/{chapter.topics.length}
              </div>
              <p className="text-sm text-gray-600">Topics Complete</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Topics List */}
      <div className="grid gap-4">
        {chapter.topics.map((topic, index) => {
          const isCompleted = completedTopics.includes(topic.topicName);
          
          return (
            <TopicCard
              key={index}
              topic={topic}
              index={index}
              isCompleted={isCompleted}
              onTopicComplete={onTopicComplete}
            />
          );
        })}
      </div>

      {/* Chapter Summary */}
      {chapter.examStrategy && chapter.examStrategy.length > 0 && (
        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Trophy className="h-5 w-5" />
              Exam Strategy for this Chapter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {chapter.examStrategy.map((strategy, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <span className="text-purple-500 mt-1">→</span>
                  {strategy}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DetailedChapterView;
