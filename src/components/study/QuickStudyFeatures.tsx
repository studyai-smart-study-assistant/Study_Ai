
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Calculator, 
  FileText, 
  Brain,
  Sparkles,
  Clock,
  Target,
  Zap
} from 'lucide-react';
import InteractiveTeacherMode from './InteractiveTeacherMode';

interface QuickStudyFeaturesProps {
  onFeatureSelect: (message: string) => void;
}

const QuickStudyFeatures: React.FC<QuickStudyFeaturesProps> = ({ onFeatureSelect }) => {
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  const features = [
    {
      id: 'ai-teacher',
      title: 'AI Teacher',
      hindiTitle: 'AI शिक्षक',
      description: 'Interactive AI teaching with personalized lessons',
      hindiDesc: 'व्यक्तिगत पाठों के साथ इंटरैक्टिव AI शिक्षण',
      icon: Brain,
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      action: () => setActiveFeature('ai-teacher'),
      isNew: true
    },
    {
      id: 'exam-prep',
      title: 'Exam Prep',
      hindiTitle: 'परीक्षा तैयारी',
      description: 'Smart exam preparation with AI guidance',
      hindiDesc: 'AI मार्गदर्शन के साथ स्मार्ट परीक्षा तैयारी',
      icon: Target,
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      action: () => onFeatureSelect('मुझे परीक्षा की तैयारी के लिए एक detailed study plan चाहिए')
    },
    {
      id: 'homework',
      title: 'Homework',
      hindiTitle: 'होमवर्क सहायता',
      description: 'Step-by-step homework solutions',
      hindiDesc: 'चरणबद्ध होमवर्क समाधान',
      icon: Calculator,
      color: 'bg-green-100 text-green-800 border-green-200',
      action: () => onFeatureSelect('मुझे अपने homework में मदद चाहिए। Step by step solution बताएं।')
    },
    {
      id: 'notes',
      title: 'Smart Notes',
      hindiTitle: 'स्मार्ट नोट्स',
      description: 'AI-powered notes generation',
      hindiDesc: 'AI-संचालित नोट्स निर्माण',
      icon: FileText,
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      action: () => onFeatureSelect('मुझे इस topic के लिए comprehensive notes बनाकर दें।')
    }
  ];

  if (activeFeature === 'ai-teacher') {
    return (
      <div className="w-full space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <span className="hidden sm:inline">AI Teacher Mode</span>
            <span className="sm:hidden">AI शिक्षक</span>
          </h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setActiveFeature(null)}
            className="text-xs px-3 py-1"
          >
            <span className="hidden sm:inline">Back</span>
            <span className="sm:hidden">वापस</span>
          </Button>
        </div>
        <InteractiveTeacherMode onSendMessage={onFeatureSelect} />
      </div>
    );
  }

  return (
    <Card className="w-full border-0 shadow-sm bg-gradient-to-br from-blue-50 to-purple-50">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
            <span className="hidden sm:inline">Quick Study Features</span>
            <span className="sm:hidden">स्टडी फीचर्स</span>
          </CardTitle>
          <div className="flex gap-1">
            <Badge variant="outline" className="bg-white/80 text-xs px-2 py-1">
              <Clock className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Quick Access</span>
              <span className="sm:hidden">तुरंत</span>
            </Badge>
            <Badge className="bg-purple-600 text-white text-xs px-2 py-1">
              <Zap className="h-3 w-3 mr-1" />
              AI
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {features.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <Button
                key={feature.id}
                variant="outline"
                onClick={feature.action}
                className={`${feature.color} h-auto p-3 sm:p-4 flex flex-col items-start text-left space-y-2 hover:scale-105 transition-all duration-200 relative`}
              >
                {feature.isNew && (
                  <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 py-0">
                    <span className="hidden sm:inline">NEW</span>
                    <span className="sm:hidden">नया</span>
                  </Badge>
                )}
                <div className="flex items-center gap-2 w-full">
                  <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <div className="text-sm sm:text-base font-medium">
                    <span className="hidden sm:inline">{feature.title}</span>
                    <span className="sm:hidden">{feature.hindiTitle}</span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm opacity-80 text-left">
                  <span className="hidden sm:inline">{feature.description}</span>
                  <span className="sm:hidden">{feature.hindiDesc}</span>
                </p>
              </Button>
            );
          })}
        </div>
        
        <div className="mt-4 p-3 bg-white/60 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">
              <span className="hidden sm:inline">AI-Powered Learning</span>
              <span className="sm:hidden">AI सीखना</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-purple-700">
            <span className="hidden sm:inline">
              Get personalized study assistance with advanced AI technology
            </span>
            <span className="sm:hidden">
              उन्नत AI तकनीक के साथ व्यक्तिगत अध्ययन सहायता पाएं
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickStudyFeatures;
