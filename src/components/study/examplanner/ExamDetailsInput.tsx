import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, BookOpen, Target, Settings } from 'lucide-react';
import { ExamPlanData } from './types';

interface ExamDetailsInputProps {
  onSubmit: (data: ExamPlanData) => void;
  isLoading: boolean;
}

const ExamDetailsInput: React.FC<ExamDetailsInputProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<Partial<ExamPlanData>>({
    subjects: [],
    studyTimeSlots: [],
    difficultyLevel: 'medium',
    explanationStyle: 'detailed',
    learningStyle: 'Visual',
    includeExamples: true,
    includePractice: true,
    includeRevision: true,
    includeMotivation: true
  });

  const availableSubjects = [
    'राजनीतिक विज्ञान', 'भूगोल', 'इतिहास', 'हिंदी', 'English',
    'गणित', 'भौतिकी', 'रसायन', 'जीव विज्ञान', 'अर्थशास्त्र',
    'समाजशास्त्र', 'मनोविज्ञान', 'दर्शनशास्त्र'
  ];

  const timeSlots = [
    '8:30-9:00 (सुबह)', '10:00-11:00 (सुबह)', '2:00-3:00 (दोपहर)',
    '8:00-9:00 (शाम)', '10:00-11:00 (रात)', '11:00-12:00 (रात)',
    '6:00-7:00 (सुबह)', '7:00-8:00 (सुबह)'
  ];

  const handleSubjectToggle = (subject: string) => {
    const currentSubjects = formData.subjects || [];
    if (currentSubjects.includes(subject)) {
      setFormData({
        ...formData,
        subjects: currentSubjects.filter(s => s !== subject)
      });
    } else {
      setFormData({
        ...formData,
        subjects: [...currentSubjects, subject]
      });
    }
  };

  const handleTimeSlotToggle = (slot: string) => {
    const currentSlots = formData.studyTimeSlots || [];
    if (currentSlots.includes(slot)) {
      setFormData({
        ...formData,
        studyTimeSlots: currentSlots.filter(s => s !== slot)
      });
    } else {
      setFormData({
        ...formData,
        studyTimeSlots: [...currentSlots, slot]
      });
    }
  };

  const validateForm = (): boolean => {
    if (!formData.examName?.trim()) {
      alert('कृपया परीक्षा का नाम भरें');
      return false;
    }
    if (!formData.examDate) {
      alert('कृपया परीक्षा की तारीख चुनें');
      return false;
    }
    if (!formData.subjects?.length) {
      alert('कृपया कम से कम एक विषय चुनें');
      return false;
    }
    if (!formData.studyTimeSlots?.length) {
      alert('कृपया अपना अध्ययन समय चुनें');
      return false;
    }
    // Set default values for required fields
    const completeData = {
      ...formData,
      class: formData.class || 'Not specified',
      dailyHours: formData.studyTimeSlots?.length || 2,
      learningStyle: formData.learningStyle || 'Visual'
    };
    return true;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const completeData = {
        ...formData,
        class: formData.class || 'Not specified',
        dailyHours: formData.studyTimeSlots?.length || 2,
        learningStyle: formData.learningStyle || 'Visual'
      } as ExamPlanData;
      onSubmit(completeData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card className="border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            बुनियादी जानकारी
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="examName">परीक्षा का नाम *</Label>
              <Input
                id="examName"
                value={formData.examName || ''}
                onChange={(e) => setFormData({ ...formData, examName: e.target.value })}
                placeholder="उदा: Bihar Board 12th, JEE Main, NEET"
              />
            </div>
            <div>
              <Label htmlFor="examDate">परीक्षा की तारीख *</Label>
              <Input
                id="examDate"
                type="date"
                value={formData.examDate || ''}
                onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="class">कक्षा/स्तर</Label>
            <Input
              id="class"
              value={formData.class || ''}
              onChange={(e) => setFormData({ ...formData, class: e.target.value })}
              placeholder="उदा: 12th, Graduate Level"
            />
          </div>
          
          <div>
            <Label>विषय चुनें * (अपने exam के अनुसार)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {availableSubjects.map(subject => (
                <div key={subject} className="flex items-center space-x-2">
                  <Checkbox
                    id={subject}
                    checked={formData.subjects?.includes(subject) || false}
                    onCheckedChange={() => handleSubjectToggle(subject)}
                  />
                  <Label htmlFor={subject} className="text-sm">{subject}</Label>
                </div>
              ))}
            </div>
            {(formData.subjects?.length || 0) > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {formData.subjects?.map(subject => (
                  <Badge key={subject} variant="secondary">{subject}</Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Personal Assessment */}
      <Card className="border-green-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
            <User className="h-4 w-4" />
            व्यक्तिगत मूल्यांकन
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="currentStatus">वर्तमान अध्ययन स्थिति</Label>
            <Textarea
              id="currentStatus"
              value={formData.currentStatus || ''}
              onChange={(e) => setFormData({ ...formData, currentStatus: e.target.value })}
              placeholder="जैसे: राजनीतिक विज्ञान का पहला चैप्टर, भूगोल के 3 चैप्टर पढ़े हैं..."
              rows={3}
            />
          </div>

          <div>
            <Label>दैनिक अध्ययन समय * (अपने free time slots चुनें)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {timeSlots.map(slot => (
                <div key={slot} className="flex items-center space-x-2">
                  <Checkbox
                    id={slot}
                    checked={formData.studyTimeSlots?.includes(slot) || false}
                    onCheckedChange={() => handleTimeSlotToggle(slot)}
                  />
                  <Label htmlFor={slot} className="text-sm">{slot}</Label>
                </div>
              ))}
            </div>
            {(formData.studyTimeSlots?.length || 0) > 0 && (
              <div className="mt-2">
                <p className="text-sm text-green-600">
                  कुल अध्ययन समय: {formData.studyTimeSlots?.length || 0} घंटे प्रतिदिन
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weakAreas">कमजोर क्षेत्र</Label>
              <Textarea
                id="weakAreas"
                value={formData.weakAreas || ''}
                onChange={(e) => setFormData({ ...formData, weakAreas: e.target.value })}
                placeholder="जैसे: इतिहास समझने में कठिनाई, English पढ़ने में दिक्कत..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="strongAreas">मजबूत क्षेत्र</Label>
              <Textarea
                id="strongAreas"
                value={formData.strongAreas || ''}
                onChange={(e) => setFormData({ ...formData, strongAreas: e.target.value })}
                placeholder="जैसे: भूगोल अच्छा है, राजनीति विज्ञान समझ आता है..."
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Study Preferences */}
      <Card className="border-orange-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
            <Settings className="h-4 w-4" />
            अध्ययन प्राथमिकताएं
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>कठिनाई स्तर</Label>
              <Select onValueChange={(value) => setFormData({ ...formData, difficultyLevel: value as any })}>
                <SelectTrigger>
                  <SelectValue placeholder="चुनें" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">सामान्य</SelectItem>
                  <SelectItem value="medium">मध्यम</SelectItem>
                  <SelectItem value="advanced">उन्नत</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>व्याख्या शैली</Label>
              <Select onValueChange={(value) => setFormData({ ...formData, explanationStyle: value as any })}>
                <SelectTrigger>
                  <SelectValue placeholder="चुनें" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="detailed">विस्तृत</SelectItem>
                  <SelectItem value="concise">संक्षिप्त</SelectItem>
                  <SelectItem value="exam-focused">परीक्षा केंद्रित</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>सीखने की शैली</Label>
              <Select onValueChange={(value) => setFormData({ ...formData, learningStyle: value as any })}>
                <SelectTrigger>
                  <SelectValue placeholder="चुनें" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Visual">दृश्य (Visual)</SelectItem>
                  <SelectItem value="Auditory">श्रवण (Auditory)</SelectItem>
                  <SelectItem value="Kinesthetic">गतिक (Kinesthetic)</SelectItem>
                  <SelectItem value="Reading/Writing">पठन/लेखन</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label>अतिरिक्त विकल्प</Label>
            {[
              { key: 'includeExamples', label: 'उदाहरण शामिल करें' },
              { key: 'includePractice', label: 'अभ्यास प्रश्न शामिल करें' },
              { key: 'includeRevision', label: 'पुनरावृत्ति योजना शामिल करें' },
              { key: 'includeMotivation', label: 'प्रेरणा तत्व शामिल करें' }
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={key}
                  checked={formData[key as keyof ExamPlanData] as boolean}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, [key]: checked })
                  }
                />
                <Label htmlFor={key}>{label}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full bg-purple-600 hover:bg-purple-700 h-12"
        size="lg"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            AI Teacher आपकी योजना बना रहा है...
          </>
        ) : (
          <>
            <Target className="mr-2 h-5 w-5" />
            Smart Study Plan Generate करें
          </>
        )}
      </Button>
    </div>
  );
};

export default ExamDetailsInput;
