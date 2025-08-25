
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Award, Target, Lightbulb } from 'lucide-react';
import { StudyPlan } from '../types';

interface ExamTipsViewProps {
  studyPlan: StudyPlan;
}

const ExamTipsView: React.FC<ExamTipsViewProps> = ({ studyPlan }) => {
  // Convert English tips to Hindi if needed
  const hindiTips = [
    "नियमित अध्ययन की आदत बनाएं और समय सारणी का पालन करें",
    "कठिन विषयों पर अधिक समय दें और आसान विषयों को भी न छोड़ें",
    "नोट्स बनाने की आदत डालें और मुख्य बिंदुओं को हाइलाइट करें", 
    "Mock test और previous year papers का अभ्यास नियमित रूप से करें",
    "स्वस्थ आहार लें, पर्याप्त नींद लें और तनाव से बचें",
    "Revision के लिए अलग से समय निकालें और बार-बार दोहराएं",
    "समूह अध्ययन करें और दोस्तों के साथ विषयों पर चर्चा करें",
    "परीक्षा से पहले आत्मविश्वास बढ़ाने वाली गतिविधियां करें"
  ];

  const motivationalQuotes = [
    "सफलता का रहस्य तैयारी में है, भाग्य में नहीं।",
    "कड़ी मेहनत का कोई विकल्प नहीं है।",
    "आज की मेहनत कल की सफलता है।",
    "असफलता सफलता की पहली सीढ़ी है।",
    "धैर्य और अभ्यास से हर लक्ष्य प्राप्त होता है।"
  ];

  const studyStrategies = [
    "सुबह जल्दी उठकर अध्ययन करें - मन तेज होता है",
    "25 मिनट अध्ययन, 5 मिनट break (Pomodoro Technique)",
    "Active recall करें - पढ़ने के बाद खुद से प्रश्न पूछें",
    "Spaced repetition - बार-बार revision करें",
    "Visual aids का उपयोग करें - diagrams, charts, mind maps"
  ];

  return (
    <div className="space-y-4">
      {/* Exam Success Tips */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Star className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base">परीक्षा सफलता के सुझाव</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {hindiTips.slice(0, 6).map((tip, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-green-500 mt-1 text-sm">✓</span>
                <p className="text-xs sm:text-sm">{tip}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Study Strategies */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Target className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base">अध्ययन रणनीति</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {studyStrategies.map((strategy, index) => (
              <div key={index} className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg">
                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-700">{index + 1}</span>
                </div>
                <p className="text-xs sm:text-sm">{strategy}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Motivational Quotes */}
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <Award className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base">दैनिक प्रेरणा</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {motivationalQuotes.map((quote, index) => (
              <blockquote key={index} className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400 italic">
                <p className="text-xs sm:text-sm">"{quote}"</p>
              </blockquote>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Health & Wellness Tips */}
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-700">
            <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base">स्वास्थ्य और तंदुरुस्ती</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-orange-50 rounded-lg">
              <h4 className="font-medium text-orange-800 mb-2 text-sm">शारीरिक स्वास्थ्य:</h4>
              <ul className="text-xs space-y-1">
                <li>• 7-8 घंटे की नींद लें</li>
                <li>• नियमित व्यायाम करें</li>
                <li>• संतुलित आहार लें</li>
                <li>• पानी भरपूर पिएं</li>
              </ul>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <h4 className="font-medium text-orange-800 mb-2 text-sm">मानसिक स्वास्थ्य:</h4>
              <ul className="text-xs space-y-1">
                <li>• Meditation करें</li>
                <li>• तनाव से बचें</li>
                <li>• सकारात्मक सोचें</li>
                <li>• मनोरंजन का समय निकालें</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExamTipsView;
