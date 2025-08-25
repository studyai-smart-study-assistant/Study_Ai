
import { ExamPlanData } from './types';

export interface EnhancedPromptConfig {
  includePersonalization: boolean;
  includeSyllabusValidation: boolean;
  includeAdaptiveContent: boolean;
  responseFormat: 'structured' | 'natural';
}

export const generateEnhancedStudyPlanPrompt = (
  examData: ExamPlanData,
  config: EnhancedPromptConfig = {
    includePersonalization: true,
    includeSyllabusValidation: true,
    includeAdaptiveContent: true,
    responseFormat: 'structured'
  }
): string => {
  const basePrompt = buildBasePrompt(examData);
  const personalizationPrompt = config.includePersonalization 
    ? buildPersonalizationPrompt(examData) 
    : '';
  const syllabusPrompt = config.includeSyllabusValidation 
    ? buildSyllabusValidationPrompt(examData) 
    : '';
  const formatPrompt = buildResponseFormatPrompt(config.responseFormat);
  
  return `${basePrompt}\n\n${personalizationPrompt}\n\n${syllabusPrompt}\n\n${formatPrompt}`;
};

const buildBasePrompt = (examData: ExamPlanData): string => {
  return `मेरी ${examData.examName} परीक्षा के लिए ${examData.examDate} तक एक अत्यधिक व्यक्तिगत और विस्तृत अध्ययन योजना बनाएं।

मूलभूत जानकारी:
- परीक्षा: ${examData.examName}
- कक्षा: ${examData.class}
- विषय: ${examData.subjects.join(', ')}
- दैनिक अध्ययन समय: ${examData.dailyHours} घंटे
- परीक्षा तिथि: ${examData.examDate}`;
};

const buildPersonalizationPrompt = (examData: ExamPlanData): string => {
  return `व्यक्तिगत प्रोफाइल:
- वर्तमान अध्ययन स्थिति: ${examData.currentStatus}
- कमजोर क्षेत्र: ${examData.weakAreas}
- मजबूत क्षेत्र: ${examData.strongAreas}
- कठिनाई स्तर: ${examData.difficultyLevel}
- व्याख्या शैली: ${examData.explanationStyle}
- अध्ययन समय स्लॉट: ${examData.studyTimeSlots.join(', ')}

इस व्यक्तिगत जानकारी के आधार पर:
1. कमजोर क्षेत्रों के लिए अतिरिक्त समय और विशेष रणनीति दें
2. मजबूत क्षेत्रों का उपयोग करके कमजोर क्षेत्रों को समझाने की तकनीक सुझाएं
3. चुने गए कठिनाई स्तर के अनुसार content की गहराई adjust करें
4. व्याख्या शैली के अनुसार information presentation करें`;
};

const buildSyllabusValidationPrompt = (examData: ExamPlanData): string => {
  return `महत्वपूर्ण निर्देश:
- केवल ${examData.class} ${examData.examName} के official syllabus के topics ही शामिल करें
- प्रत्येक chapter के लिए official chapter numbers और names का उपयोग करें
- यदि किसी topic के बारे में confirm नहीं हैं तो "सिलेबस की पुष्टि करें" का note दें
- Board-specific weightage और marking scheme को consider करें`;
};

const buildResponseFormatPrompt = (format: 'structured' | 'natural'): string => {
  if (format === 'structured') {
    return `कृपया निम्नलिखित JSON format में जवाब दें:
{
  "overview": "योजना का संक्षिप्त विवरण",
  "totalDaysAvailable": number,
  "dailyStudyHours": number,
  "subjectPlans": [
    {
      "subjectName": "विषय का नाम",
      "priorityLevel": "high/medium/low",
      "chapters": [
        {
          "chapterNumber": number,
          "chapterName": "अध्याय का नाम",
          "importance": "high/medium/low",
          "estimatedHours": number,
          "topics": [
            {
              "topicName": "टॉपिक का नाम",
              "importance": "critical/important/moderate",
              "estimatedMinutes": number,
              "keyPoints": ["मुख्य बिंदु"],
              "studyTips": ["अध्ययन सुझाव"],
              "practiceQuestions": ["अभ्यास प्रश्न"]
            }
          ]
        }
      ]
    }
  ],
  "dailyTasks": [
    {
      "date": "YYYY-MM-DD",
      "subject": "विषय",
      "chapter": "अध्याय",
      "topics": ["टॉपिक्स"],
      "duration": number,
      "type": "study/revision/practice/test",
      "priority": "urgent/important/normal",
      "detailedInstructions": ["विस्तृत निर्देश"]
    }
  ],
  "weeklyGoals": [
    {
      "week": number,
      "subjects": ["विषय"],
      "chapters": ["अध्याय"],
      "targetCompletion": number,
      "focus": "मुख्य फोकस"
    }
  ]
}`;
  }
  
  return `प्राकृतिक भाषा में विस्तृत जवाब दें जो पढ़ने में आसान हो।`;
};

export const generateAdaptivePrompt = (
  examData: ExamPlanData,
  userProgress: any,
  performanceData: any
): string => {
  return `पिछली प्रगति के आधार पर योजना को adjust करें:

प्रगति डेटा:
- पूरे किए गए कार्य: ${userProgress.completedTasks}/${userProgress.totalTasks}
- औसत स्कोर: ${performanceData.averageScore}%
- कमजोर पाए गए विषय: ${performanceData.weakSubjects?.join(', ') || 'कोई नहीं'}
- अच्छे प्रदर्शन वाले विषय: ${performanceData.strongSubjects?.join(', ') || 'कोई नहीं'}

कृपया इस डेटा के आधार पर:
1. कमजोर विषयों के लिए अतिरिक्त practice time बढ़ाएं
2. अच्छे प्रदर्शन वाले विषयों का revision schedule adjust करें
3. Overall difficulty level को performance के अनुसार modify करें
4. नए milestones और targets suggest करें`;
};
