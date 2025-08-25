import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  CheckCircle2, 
  PlayCircle, 
  Star,
  Brain,
  Lightbulb,
  Trophy,
  AlertCircle
} from 'lucide-react';
import { TopicInfo } from '../types';

interface TopicCardProps {
  topic: TopicInfo;
  index: number;
  isCompleted: boolean;
  onTopicComplete: (topicName: string, feedback: any) => void;
}

const TopicCard: React.FC<TopicCardProps> = ({ 
  topic, 
  index, 
  isCompleted, 
  onTopicComplete 
}) => {
  const [isStudying, setIsStudying] = useState(false);
  const [studyTimer, setStudyTimer] = useState(0);

  const startStudySession = () => {
    setIsStudying(true);
  };

  const completeTopicStudy = () => {
    onTopicComplete(topic.topicName, {
      timeSpent: studyTimer,
      completed: true,
      rating: 5
    });
    setIsStudying(false);
    setStudyTimer(0);
  };

  return (
    <Card className={`border-l-4 ${
      isCompleted ? 'border-l-green-400 bg-green-50' :
      topic.importance === 'critical' ? 'border-l-red-400' :
      topic.importance === 'important' ? 'border-l-yellow-400' :
      'border-l-blue-400'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isCompleted ? (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            ) : (
              <BookOpen className="h-6 w-6 text-blue-600" />
            )}
            <div>
              <CardTitle className="text-lg">{topic.topicName}</CardTitle>
              <p className="text-sm text-gray-600">{topic.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${
              topic.importance === 'critical' ? 'bg-red-100 text-red-800' :
              topic.importance === 'important' ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {topic.importance}
            </Badge>
            <Badge variant="outline">
              {topic.estimatedMinutes} min
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="study">How to Study</TabsTrigger>
            <TabsTrigger value="practice">Practice</TabsTrigger>
            <TabsTrigger value="tips">Tips & Tricks</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold flex items-center gap-2 text-blue-700 mb-2">
                  <Star className="h-4 w-4" />
                  Key Points to Remember
                </h4>
                <ul className="space-y-1">
                  {topic.keyPoints.map((point, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="study" className="mt-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold flex items-center gap-2 text-green-700 mb-2">
                  <BookOpen className="h-4 w-4" />
                  What to Study (Step by Step)
                </h4>
                <ol className="space-y-2">
                  {topic.whatToStudy?.map((step, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold min-w-[24px] text-center">
                        {idx + 1}
                      </span>
                      <span className="pt-1">{step}</span>
                    </li>
                  )) || [
                    <li key="default" className="text-sm text-gray-500">
                      Detailed study steps will be generated based on your exam requirements
                    </li>
                  ]}
                </ol>
              </div>

              <div>
                <h4 className="font-semibold flex items-center gap-2 text-purple-700 mb-2">
                  <Brain className="h-4 w-4" />
                  How to Study (Methods & Techniques)
                </h4>
                <ul className="space-y-1">
                  {topic.howToStudy?.map((method, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-purple-500 mt-1">→</span>
                      {method}
                    </li>
                  )) || [
                    <li key="default" className="text-sm text-gray-500">
                      Specific study methods will be customized for this topic
                    </li>
                  ]}
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="practice" className="mt-4">
            <div>
              <h4 className="font-semibold flex items-center gap-2 text-orange-700 mb-2">
                <Trophy className="h-4 w-4" />
                Practice Questions & Exercises
              </h4>
              <ul className="space-y-2">
                {topic.practiceQuestions?.map((question, idx) => (
                  <li key={idx} className="text-sm p-2 bg-orange-50 rounded border-l-2 border-orange-400">
                    {question}
                  </li>
                )) || [
                  <li key="default" className="text-sm text-gray-500 p-2 bg-gray-50 rounded">
                    Practice questions will be generated based on exam patterns and difficulty level
                  </li>
                ]}
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="tips" className="mt-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold flex items-center gap-2 text-yellow-700 mb-2">
                  <Lightbulb className="h-4 w-4" />
                  Memory Tricks & Shortcuts
                </h4>
                <ul className="space-y-1">
                  {topic.memoryTricks?.map((trick, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-yellow-500 mt-1">💡</span>
                      {trick}
                    </li>
                  )) || [
                    <li key="default" className="text-sm text-gray-500">
                      Memory tricks and mnemonics will be provided for easy retention
                    </li>
                  ]}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold flex items-center gap-2 text-indigo-700 mb-2">
                  <AlertCircle className="h-4 w-4" />
                  Study Tips & Common Mistakes to Avoid
                </h4>
                <ul className="space-y-1">
                  {topic.studyTips?.map((tip, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-indigo-500 mt-1">✓</span>
                      {tip}
                    </li>
                  )) || [
                    <li key="default" className="text-sm text-gray-500">
                      Personalized study tips and common pitfalls will be highlighted
                    </li>
                  ]}
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            {isStudying && (
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Currently Studying</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {!isCompleted && !isStudying && (
              <Button 
                onClick={startStudySession}
                className="bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                <PlayCircle className="h-4 w-4 mr-1" />
                Start Study
              </Button>
            )}
            
            {isStudying && (
              <Button 
                onClick={completeTopicStudy}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Mark Complete
              </Button>
            )}
            
            {isCompleted && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TopicCard;
