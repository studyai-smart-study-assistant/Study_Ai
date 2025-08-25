
import { generateResponse } from '@/lib/gemini';
import { ExamPlanData, StudyPlan, SubjectPlan, DailyTask, ChapterInfo, TopicInfo } from './types';

export const generateDetailedStudyPlan = async (examData: ExamPlanData): Promise<StudyPlan> => {
  try {
    console.log('Generating comprehensive study plan for:', examData.examName);
    
    const prompt = buildEnhancedStudyPlanPrompt(examData);
    const response = await generateResponse(prompt, [], undefined, 'default');
    
    try {
      const parsedPlan = JSON.parse(response);
      console.log('Successfully parsed AI response');
      return enhanceGeneratedPlan(parsedPlan, examData);
    } catch (parseError) {
      console.warn('JSON parsing failed, creating structured plan from text response');
      return createStructuredPlanFromText(response, examData);
    }
  } catch (error) {
    console.error('Error generating study plan:', error);
    throw new Error('Study plan generation failed');
  }
};

const buildEnhancedStudyPlanPrompt = (examData: ExamPlanData): string => {
  const examDate = new Date(examData.examDate);
  const today = new Date();
  const daysAvailable = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const dailyHours = examData.studyTimeSlots.length;

  return `
आप एक MASTER TEACHER हैं जो ULTRA-DETAILED study plan बनाते हैं। Student को EXACT जानकारी चाहिए कि हर chapter में क्या पढ़ना है, कैसे पढ़ना है, कितना समय देना है।

EXAM DETAILS:
- परीक्षा: ${examData.examName}
- परीक्षा की तारीख: ${examData.examDate}
- उपलब्ध दिन: ${daysAvailable} दिन
- विषय: ${examData.subjects.join(', ')}
- दैनिक अध्ययन समय: ${dailyHours} घंटे

STUDENT PROFILE:
- वर्तमान स्थिति: ${examData.currentStatus}
- कमजोर क्षेत्र: ${examData.weakAreas}
- मजबूत क्षेत्र: ${examData.strongAreas}

आपको करना है:

1. हर subject के लिए COMPLETE CHAPTER LIST बनाना (minimum 12-15 chapters प्रति subject)
2. हर chapter के लिए DETAILED TOPICS list देना (5-8 topics per chapter)
3. हर topic के लिए:
   - KEY POINTS (exactly क्या समझना है)
   - WHAT TO STUDY (step-by-step study method)
   - HOW TO STUDY (effective techniques)
   - TIME ALLOCATION (minutes में)
   - PRACTICE QUESTIONS (types और examples)
   - MEMORY TRICKS (याद रखने के तरीके)

4. Chapter-wise DIFFICULTY LEVEL और IMPORTANCE
5. Specific STUDY TECHNIQUES for each topic
6. EXAM-FOCUSED tips for each chapter

JSON format में respond करें:

{
  "overview": "Complete study plan overview",
  "totalDaysAvailable": ${daysAvailable},
  "dailyStudyHours": ${dailyHours},
  "subjectPlans": [
    {
      "subjectName": "विषय नाम",
      "totalChapters": 15,
      "priorityLevel": "high",
      "overallStrategy": "विषय की पूर्ण रणनीति",
      "chapters": [
        {
          "chapterNumber": 1,
          "chapterName": "पूरा Chapter नाम",
          "importance": "high",
          "estimatedHours": 8,
          "difficultyLevel": "medium",
          "examWeightage": "15%",
          "topics": [
            {
              "topicName": "Specific Topic नाम",
              "importance": "critical",
              "estimatedMinutes": 120,
              "description": "इस topic में क्या पढ़ना है - detailed explanation",
              "keyPoints": [
                "Point 1 - exactly क्या समझना है",
                "Point 2 - कौन सा concept important है",
                "Point 3 - कौन से examples देखने हैं",
                "Point 4 - कौन से formulas याद करने हैं",
                "Point 5 - कौन से diagrams बनाने हैं"
              ],
              "whatToStudy": [
                "Step 1: पहले यह specific section पढ़ें",
                "Step 2: फिर यह particular examples solve करें",
                "Step 3: यह specific practice करें",
                "Step 4: यह तरीके से revision करें"
              ],
              "howToStudy": [
                "Reading technique: कैसे effectively पढ़ें",
                "Note-making: कैसे notes बनाएं",
                "Memory technique: कैसे याद रखें",
                "Practice method: कैसे practice करें"
              ],
              "practiceQuestions": [
                "Question type 1 - कैसे solve करना है",
                "Question type 2 - कौन सी tricks use करनी हैं",
                "Previous year में कैसे questions आए हैं"
              ],
              "memoryTricks": [
                "Mnemonic 1: यह trick से याद रखें",
                "Association: इससे connect करके याद रखें",
                "Visual technique: इस तरह visualize करें"
              ],
              "studyTips": [
                "Tip 1: इस तरह approach करें",
                "Tip 2: यह mistake avoid करें",
                "Tip 3: यह shortcut use करें"
              ]
            }
          ],
          "practiceQuestions": 25,
          "revisionTips": [
            "यह chapter कैसे revise करना है",
            "कौन से short tricks use करने हैं",
            "कौन से diagrams/formulas most important हैं"
          ],
          "examStrategy": [
            "Exam में इस chapter से कैसे questions आते हैं",
            "Time management: कितना समय देना है",
            "Answer writing technique इस chapter के लिए"
          ],
          "commonMistakes": [
            "Students यह गलती करते हैं - avoid करें",
            "यह confusion हो सकता है - clear करने का तरीका"
          ]
        }
      ]
    }
  ],
  "dailyTasks": [
    {
      "id": "task_1",
      "date": "2026-01-01",
      "subject": "विषय नाम",
      "chapter": "Chapter का पूरा नाम",
      "topic": "Specific topic name",
      "duration": 120,
      "type": "study",
      "priority": "urgent",
      "description": "आज यह specific topic पढ़ना है",
      "detailedInstructions": [
        "Step 1: पहले यह exact section पढ़ें (specific page numbers)",
        "Step 2: फिर यह particular examples solve करें",
        "Step 3: यह specific practice questions करें",
        "Step 4: Notes बनाएं इस format में"
      ],
      "studyMethod": "कैसे approach करना है आज के task को",
      "expectedOutcome": "आज के बाद आपको यह clear होना चाहिए",
      "completed": false
    }
  ],
  "weeklyGoals": [
    {
      "week": 1,
      "startDate": "2026-01-01",
      "endDate": "2026-01-07",
      "subjects": ["subject1", "subject2"],
      "chapters": ["Chapter 1", "Chapter 2"],
      "targetCompletion": 25,
      "focus": "Foundation building और basic concepts",
      "assessment": "Week 1 test",
      "detailedTargets": [
        "Subject 1 के Chapter 1-2 के सभी topics complete करना",
        "हर topic के key points को notes में लिखना",
        "Total 50 practice questions solve करना",
        "Memory tricks implement करना"
      ],
      "studySchedule": [
        "Monday-Tuesday: Subject 1, Chapter 1 (Topics 1-3)",
        "Wednesday-Thursday: Subject 1, Chapter 1 (Topics 4-6)",
        "Friday-Saturday: Subject 2, Chapter 1 (Topics 1-4)",
        "Sunday: Revision और practice"
      ]
    }
  ]
}

IMPORTANT: 
- हर subject के लिए MINIMUM 12-15 detailed chapters दें
- हर chapter में 6-8 comprehensive topics दें  
- हर topic के लिए specific "what to study", "how to study", और "memory tricks" दें
- Practical और actionable instructions दें जो student easily follow कर सके
- Time allocation realistic रखें लेकिन detailed रखें

अब ${examData.examName} के लिए ULTRA-DETAILED comprehensive study plan बनाएं।
`;
};

const enhanceGeneratedPlan = (parsedPlan: any, examData: ExamPlanData): StudyPlan => {
  const enhancedPlan: StudyPlan = {
    overview: parsedPlan.overview || `${examData.examName} के लिए अति-विस्तृत अध्ययन योजना - हर topic के लिए step-by-step guidance`,
    totalDaysAvailable: parsedPlan.totalDaysAvailable || calculateDaysAvailable(examData.examDate),
    dailyStudyHours: parsedPlan.dailyStudyHours || examData.studyTimeSlots.length,
    subjectPlans: enhanceSubjectPlans(parsedPlan.subjectPlans || [], examData),
    dailyTasks: enhanceDailyTasks(parsedPlan.dailyTasks || [], examData),
    weeklyGoals: parsedPlan.weeklyGoals || generateDetailedWeeklyGoals(examData),
    revisionStrategy: parsedPlan.revisionStrategy || "व्यापक पुनरावृत्ति रणनीति - हर topic के लिए specific revision method के साथ",
    examTips: parsedPlan.examTips || getEnhancedExamTips(),
    motivationalQuotes: parsedPlan.motivationalQuotes || getMotivationalQuotes(),
    progressMilestones: parsedPlan.progressMilestones || generateMilestones(examData)
  };

  return enhancedPlan;
};

const createStructuredPlanFromText = (textResponse: string, examData: ExamPlanData): StudyPlan => {
  console.log('Creating structured plan from text response');
  
  const totalDays = calculateDaysAvailable(examData.examDate);
  const dailyHours = examData.studyTimeSlots.length;
  
  return {
    overview: `${examData.examName} के लिए AI द्वारा तैयार अति-विस्तृत अध्ययन योजना - हर chapter और topic के लिए step-by-step guidance`,
    totalDaysAvailable: totalDays,
    dailyStudyHours: dailyHours,
    subjectPlans: createUltraDetailedSubjectPlans(examData.subjects),
    dailyTasks: generateUltraDetailedDailyTasks(examData, totalDays),
    weeklyGoals: generateDetailedWeeklyGoals(examData),
    revisionStrategy: "व्यापक पुनरावृत्ति रणनीति - हर topic के लिए specific revision method के साथ",
    examTips: getEnhancedExamTips(),
    motivationalQuotes: getMotivationalQuotes(),
    progressMilestones: generateMilestones(examData)
  };
};

const calculateDaysAvailable = (examDate: string): number => {
  const exam = new Date(examDate);
  const today = new Date();
  return Math.max(1, Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
};

const enhanceSubjectPlans = (subjectPlans: any[], examData: ExamPlanData): SubjectPlan[] => {
  return examData.subjects.map((subject, index) => {
    const existingPlan = subjectPlans.find(plan => plan.subjectName === subject);
    return existingPlan || createUltraDetailedSubjectPlan(subject, index);
  });
};

const createUltraDetailedSubjectPlan = (subject: string, index: number): SubjectPlan => {
  const subjectChapters = getUltraDetailedSubjectChapters(subject);
  
  return {
    subjectName: subject,
    totalChapters: subjectChapters.length,
    priorityLevel: index < 2 ? 'high' : 'medium',
    overallStrategy: `${subject} के लिए comprehensive approach - हर chapter के लिए detailed study method और specific techniques के साथ`,
    chapters: subjectChapters,
    revisionSchedule: [
      {
        week: 1,
        chapters: subjectChapters.slice(0, 3).map(ch => ch.chapterName),
        focus: "बुनियादी अवधारणाओं की मजबूत नींव - detailed understanding के साथ",
        duration: 240,
        specificTasks: [
          "हर chapter के सभी key points को detailed notes में लिखना",
          "Memory tricks का use करके important concepts याद करना",
          "Practice questions systematically solve करना"
        ]
      },
      {
        week: 2,
        chapters: subjectChapters.slice(3, 6).map(ch => ch.chapterName),
        focus: "मध्यम स्तरीय topics और practical applications",
        duration: 280,
        specificTasks: [
          "Advanced topics को examples के साथ समझना",
          "Previous year questions का analysis करना",
          "Weak areas की identification और improvement"
        ]
      }
    ]
  };
};

const getUltraDetailedSubjectChapters = (subject: string): ChapterInfo[] => {
  const ultraDetailedChapterMaps: { [key: string]: ChapterInfo[] } = {
    'इतिहास': [
      {
        chapterNumber: 1,
        chapterName: "प्राचीन भारतीय सभ्यताएं - सिंधु घाटी से वैदिक काल तक",
        importance: 'high',
        estimatedHours: 12,
        topics: [
          {
            topicName: "सिंधु घाटी सभ्यता - संपूर्ण विश्लेषण",
            importance: 'critical',
            estimatedMinutes: 150,
            description: "सिंधु घाटी सभ्यता की समस्त विशेषताओं का गहन अध्ययन - नगर योजना से लेकर पतन के कारणों तक",
            keyPoints: [
              "हड़प्पा सभ्यता की खोज - 1921 में दयाराम साहनी द्वारा",
              "मुख्य स्थल - हड़प्पा, मोहनजोदड़ो, धौलावीरा, लोथल, कालीबंगा",
              "Grid Pattern नगर योजना - सड़कें 90 डिग्री पर कटती थीं",
              "उन्नत जल निकासी व्यवस्था - covered drains, manholes",
              "समाजिक समानता - कोई राजमहल या मंदिर नहीं मिले",
              "व्यापारिक संबंध - मेसोपोटामिया तक फैले हुए थे"
            ],
            whatToStudy: [
              "Step 1: NCERT Class 11 History Chapter 2 पढ़ें - pages 15-35",
              "Step 2: हड़प्पा के site map और layout का diagram बनाएं",
              "Step 3: सभी major sites की location और विशेषताएं note करें",
              "Step 4: सिंधु लिपि के samples देखें और उनकी विशेषताएं समझें",
              "Step 5: पतन के theories को compare करके table बनाएं"
            ],
            howToStudy: [
              "Reading: हर paragraph के बाद रुककर main points highlight करें",
              "Note-making: Timeline format में chronological order maintain करें",
              "Visual learning: Sites का map बनाकर geographical locations mark करें",
              "Memory technique: HMDLK (Harappa-Mohenjodaro-Dholavira-Lothal-Kalibangan) acronym use करें"
            ],
            practiceQuestions: [
              "MCQ: सिंधु घाटी के मुख्य स्थलों पर आधारित",
              "Short Answer: नगर योजना की विशेषताएं (50 words)",
              "Long Answer: सिंधु सभ्यता के पतन के कारण (150 words)",
              "Map Work: भारत के map में सभी sites locate करना"
            ],
            memoryTricks: [
              "HARMO trick: Harappa-Artifact-River-Mohenjodaro-Organization",
              "2600-1900 BCE dates के लिए: '26 साल की उम्र में 19 साल पहले की बात'",
              "Indus Valley = IV = 4 features (Urban, Trade, Drainage, Equality)"
            ],
            studyTips: [
              "Archaeological evidence को factual data के रूप में याद करें",
              "Modern cities से comparison करके समझें",
              "Previous year papers में यह topic बहुत आता है - thorough preparation जरूरी"
            ]
          },
          {
            topicName: "वैदिक सभ्यता - ऋग्वैदिक और उत्तरवैदिक काल की तुलना",
            importance: 'critical',
            estimatedMinutes: 120,
            description: "वैदिक काल के दो phases का detailed comparative study - social, economic, religious changes के साथ",
            keyPoints: [
              "ऋग्वैदिक काल (1500-1000 BCE) - Pastoral society, tribal structure",
              "उत्तरवैदिक काल (1000-600 BCE) - Agricultural society, territorial kingdoms",
              "धार्मिक विकास - Nature worship से Ritualistic worship तक",
              "सामाजिक परिवर्तन - Tribal equality से Varna system तक",
              "आर्थिक बदलाव - Cattle wealth से Land-based agriculture तक",
              "राजनीतिक evolution - Sabha-Samiti से Monarchical system तक"
            ],
            whatToStudy: [
              "Step 1: NCERT में Vedic period के दोनों phases को separately पढ़ें",
              "Step 2: Comparative table बनाएं - Early vs Later Vedic",
              "Step 3: Important Vedic texts की list और उनका time period note करें",
              "Step 4: Social hierarchy का evolution chart बनाएं",
              "Step 5: Geographic expansion का map study करें"
            ],
            howToStudy: [
              "Comparison method: हमेशा दोनों periods को side-by-side compare करें",
              "Timeline approach: Chronological sequence maintain करें",
              "Source-based study: कौन सी information कौन से Veda से मिली है",
              "Change analysis: क्यों और कैसे changes हुए - reasons समझें"
            ],
            practiceQuestions: [
              "Compare and contrast: Early vs Later Vedic society",
              "Analyze: Factors responsible for social stratification",
              "Source-based: Rig Veda से मिली जानकारी पर questions",
              "Timeline: Vedic literature का chronological arrangement"
            ],
            memoryTricks: [
              "PAST vs FAST: Pastoral-Agricultural, Simple-Stratified, Tribal-Territorial",
              "1500-1000-600: 15 सौ से हजार, हजार से 6 सौ",
              "Sabha-Samiti = SS = Social-System (democratic elements)"
            ],
            studyTips: [
              "दोनों periods के बीच clear distinction maintain करें",
              "Archaeological evidence vs Literary evidence को अलग करके पढ़ें",
              "Modern parallels draw करके बेहतर understanding develop करें"
            ]
          }
        ],
        practiceQuestions: 30,
        revisionTips: [
          "Timeline method से dates और events को systematically revise करें",
          "Comparative tables का regular revision करें",
          "Map work को visual memory के लिए बार-बार practice करें",
          "Previous year questions के pattern को analyze करें"
        ]
      },
      {
        chapterNumber: 2,
        chapterName: "महाजनपद काल और प्रारंभिक राज्य व्यवस्था",
        importance: 'high',
        estimatedHours: 10,
        topics: [
          {
            topicName: "16 महाजनपद - राजनीतिक और आर्थिक विकास",
            importance: 'important',
            estimatedMinutes: 100,
            description: "16 महाजनपदों का विस्तृत अध्ययन - उनकी राजधानियां, शासन व्यवस्था और आर्थिक आधार",
            keyPoints: [
              "16 महाजनपदों की complete list - Kashi, Kosala, Anga, Magadha आदि",
              "Capitals की जानकारी - Varanasi, Shravasti, Champa, Rajagriha",
              "Geographic distribution - Gangetic plains में concentration",
              "Magadha का rise - strategic location और resources",
              "Iron technology का impact - agriculture और warfare में",
              "Trade routes का development - economic prosperity के लिए"
            ],
            whatToStudy: [
              "Step 1: सभी 16 महाजनपदों की list को map के साथ याद करें",
              "Step 2: हर महाजनपद की capital और important features note करें",
              "Step 3: Magadha के उत्थान के कारणों को detailed में समझें",
              "Step 4: इस period के coins और archaeological evidence study करें",
              "Step 5: Buddhism और Jainism के rise के साथ connection समझें"
            ],
            howToStudy: [
              "Map-based learning: India map पर सभी locations mark करें",
              "Tabular format: Name-Capital-Features का table बनाएं",
              "Cause-effect analysis: क्यों Magadha dominant बना",
              "Archaeological approach: Coins और inscriptions की images देखें"
            ],
            practiceQuestions: [
              "List और locate: 16 महाजनपदों के नाम और capitals",
              "Analytical: Magadha के rise के factors",
              "Map-based: River systems और trade routes",
              "Compare: Republican vs Monarchical systems"
            ],
            memoryTricks: [
              "MAKV trick: Magadha-Anga-Kashi-Vajji (eastern region)",
              "Capital pairs: Kashi-Varanasi, Kosala-Shravasti जैसे combinations",
              "16 = 4x4 grid में arrange करके visual memory बनाएं"
            ],
            studyTips: [
              "Geographical context को हमेशा साथ में रखें",
              "Later periods के साथ continuity देखें",
              "Archaeological evidence को textual sources से match करें"
            ]
          }
        ],
        practiceQuestions: 25
      }
    ],
    'भूगोल': [
      {
        chapterNumber: 1,
        chapterName: "भारत की भौगोलिक स्थिति और संरचना",
        importance: 'high',
        estimatedHours: 8,
        topics: [
          {
            topicName: "भारत की अक्षांशीय और देशांतरीय स्थिति - विस्तृत विश्लेषण",
            importance: 'critical',
            estimatedMinutes: 100,
            description: "भारत की geographical coordinates, उनके प्रभाव और strategic importance का comprehensive study",
            keyPoints: [
              "अक्षांशीय विस्तार: 8°4'N से 37°6'N तक (29°2' का विस्तार)",
              "देशांतरीय विस्तार: 68°7'E से 97°25'E तक (29°18' का विस्तार)",
              "कर्क रेखा (23°30'N) - 8 राज्यों से गुजरती है",
              "मानक मध्याह्न रेखा: 82°30'E (इलाहाबाद के पास से)",
              "Time zone: GMT+5:30 (single time zone despite large longitudinal extent)",
              "Strategic location: Asia के southern peninsula में स्थित"
            ],
            whatToStudy: [
              "Step 1: World map में भारत की position को accurately locate करें",
              "Step 2: Tropic of Cancer के route को भारत में trace करें",
              "Step 3: Time calculation की practice करें - longitude के basis पर",
              "Step 4: भारत के corners के coordinates को exactly याद करें",
              "Step 5: Neighboring countries के साथ boundary coordinates study करें"
            ],
            howToStudy: [
              "Map work: Blank map पर repeatedly coordinates mark करें",
              "Mathematical approach: Time और longitude के calculations practice करें",
              "Comparison method: Other countries के size से compare करें",
              "Visual memory: भारत का shape और position को visualize करें"
            ],
            practiceQuestions: [
              "Calculate: Different cities के बीच time difference",
              "Locate: Tropic of Cancer के states",
              "Compare: भारत का size other countries से",
              "Analyze: Single time zone के advantages और disadvantages"
            ],
            memoryTricks: [
              "8-37 North: 'आठ से सैंतीस उत्तर'",
              "68-97 East: 'अड़सठ से सत्तानवे पूर्व'",
              "82°30' = 82.5° = Standard time meridian",
              "Tropic states: GRWBJMTC (Gujarat-Rajasthan-West Bengal-Bihar-Jharkhand-MP-Tripura-Chhattisgarh)"
            ],
            studyTips: [
              "Coordinates को decimal degrees में भी convert करके याद रखें",
              "Time zone calculations में 4 minutes per degree का rule use करें",
              "Strategic importance को current affairs से link करें"
            ]
          }
        ],
        practiceQuestions: 20
      }
    ],
    'राजनीतिक विज्ञान': [
      {
        chapterNumber: 1,
        chapterName: "राजनीतिक सिद्धांत - मूलभूत अवधारणाएं",
        importance: 'high',
        estimatedHours: 10,
        topics: [
          {
            topicName: "राज्य के सिद्धांत और आधुनिक राज्य की अवधारणा",
            importance: 'critical',
            estimatedMinutes: 120,
            description: "राज्य के classical theories से लेकर modern state की comprehensive understanding तक",
            keyPoints: [
              "राज्य के चार आवश्यक तत्व: जनसंख्या, भूमि, सरकार, संप्रभुता",
              "Divine Theory: राज्य की उत्पत्ति ईश्वरीय इच्छा से",
              "Social Contract Theory: Hobbes, Locke, Rousseau के views",
              "Force Theory: राज्य की स्थापना बल प्रयोग से",
              "Evolutionary Theory: राज्य का क्रमिक विकास",
              "Modern State की विशेषताएं: Territory, Population, Government, Sovereignty"
            ],
            whatToStudy: [
              "Step 1: हर theory के main proponents को उनके key ideas के साथ पढ़ें",
              "Step 2: Comparative analysis करें - theories के बीच differences",
              "Step 3: Modern examples से theories को relate करें",
              "Step 4: राज्य vs सरकार vs राष्ट्र के distinctions को clear करें",
              "Step 5: Contemporary relevance को current events से link करें"
            ],
            howToStudy: [
              "Philosophical approach: हर theory के underlying philosophy को समझें",
              "Historical context: Theories के development का time period note करें",
              "Comparative study: Theories को table format में compare करें",
              "Modern application: Current political systems से examples लें"
            ],
            practiceQuestions: [
              "Compare: Divine vs Social Contract theories",
              "Analyze: Modern state के essential features",
              "Evaluate: कौन सा theory most convincing है और क्यों",
              "Apply: Theory को contemporary political situation में"
            ],
            memoryTricks: [
              "PTGS: Population-Territory-Government-Sovereignty (राज्य के तत्व)",
              "HLR: Hobbes-Locke-Rousseau (Social contract theorists)",
              "DSEF: Divine-Social-Evolutionary-Force (theories of origin)"
            ],
            studyTips: [
              "Philosophy को examples के साथ concrete बनाएं",
              "Historical context को साथ में पढ़ें",
              "Modern political systems से constantly connect करें"
            ]
          }
        ],
        practiceQuestions: 25
      }
    ]
  };

  return ultraDetailedChapterMaps[subject] || [
    {
      chapterNumber: 1,
      chapterName: `${subject} - व्यापक अध्याय 1`,
      importance: 'high',
      estimatedHours: 8,
      topics: [
        {
          topicName: "मुख्य अवधारणाएं और सिद्धांत",
          importance: 'important',
          estimatedMinutes: 120,
          description: `${subject} के मुख्य concepts, principles और उनके practical applications का विस्तृत अध्ययन`,
          keyPoints: [
            "बुनियादी परिभाषाएं और terminology की clear understanding",
            "मुख्य सिद्धांतों का theoretical और practical analysis",
            "Historical development और modern applications",
            "Key figures और उनके contributions",
            "Current relevance और contemporary examples",
            "Examination perspective से important points"
          ],
          whatToStudy: [
            "Step 1: NCERT textbook के relevant chapters को systematically पढ़ें",
            "Step 2: Key terms की glossary बनाएं detailed definitions के साथ",
            "Step 3: Important concepts को flowcharts और diagrams में represent करें",
            "Step 4: Previous year questions को analyze करके pattern identify करें",
            "Step 5: Current affairs से related examples collect करें"
          ],
          howToStudy: [
            "Active reading: हर paragraph के key points highlight करें",
            "Note-making: Structured format में comprehensive notes बनाएं",
            "Visual learning: Concepts को diagrams और charts के through समझें",
            "Regular revision: Daily quick review और weekly detailed revision"
          ],
          practiceQuestions: [
            "Conceptual understanding based MCQs",
            "Short answer questions (50-75 words)",
            "Long answer questions (150-200 words)",
            "Application-based analytical questions"
          ],
          memoryTricks: [
            "Acronyms बनाकर key points को याद रखें",
            "Visual associations का use करके concepts को memorize करें",
            "Story method से complex theories को simple बनाएं"
          ],
          studyTips: [
            "Regular practice के साथ concepts को reinforce करें",
            "Group discussions या teaching others के through understanding check करें",
            "Mock tests के through exam readiness assess करें"
          ]
        }
      ],
      practiceQuestions: 20
    }
  ];
};

const createUltraDetailedSubjectPlans = (subjects: string[]): SubjectPlan[] => {
  return subjects.map((subject, index) => createUltraDetailedSubjectPlan(subject, index));
};

const enhanceDailyTasks = (tasks: any[], examData: ExamPlanData): DailyTask[] => {
  if (tasks.length > 0) {
    return tasks.map((task, index) => ({
      id: task.id || `task_${index}`,
      date: task.date || new Date().toISOString().split('T')[0],
      subject: task.subject || examData.subjects[0],
      chapter: task.chapter || "पहला अध्याय",
      topic: task.topic || "मुख्य विषय",
      duration: task.duration || 120,
      type: task.type || 'study',
      priority: task.priority || 'normal',
      description: task.description || "विस्तृत अध्ययन कार्य",
      detailedInstructions: task.detailedInstructions || [
        "पहले मुख्य concept को समझें",
        "फिर examples के साथ practice करें", 
        "अंत में detailed notes बनाएं"
      ],
      completed: false
    }));
  }
  
  return generateUltraDetailedDailyTasks(examData, calculateDaysAvailable(examData.examDate));
};

const generateUltraDetailedDailyTasks = (examData: ExamPlanData, totalDays: number): DailyTask[] => {
  const tasks: DailyTask[] = [];
  const startDate = new Date();
  
  for (let day = 0; day < Math.min(totalDays, 45); day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);
    
    examData.subjects.forEach((subject, subjectIndex) => {
      if (day % examData.subjects.length === subjectIndex) {
        const chapters = getUltraDetailedSubjectChapters(subject);
        const chapterIndex = Math.floor(day / examData.subjects.length) % chapters.length;
        const chapter = chapters[chapterIndex];
        const topicIndex = Math.floor(day / (examData.subjects.length * chapters.length)) % chapter.topics.length;
        const topic = chapter.topics[topicIndex];
        
        tasks.push({
          id: `task_${day}_${subjectIndex}`,
          date: currentDate.toISOString().split('T')[0],
          subject,
          chapter: chapter.chapterName,
          topic: topic.topicName,
          duration: topic.estimatedMinutes,
          type: day % 7 === 6 ? 'revision' : day % 7 === 5 ? 'practice' : 'study',
          priority: chapter.importance === 'high' ? 'urgent' : topic.importance === 'critical' ? 'important' : 'normal',
          description: `${topic.description}`,
          detailedInstructions: [
            `पहले ${topic.whatToStudy[0] || 'मुख्य concept को पढ़ें'}`,
            `फिर ${topic.whatToStudy[1] || 'examples को solve करें'}`,
            `अंत में ${topic.practiceQuestions[0] || 'practice questions करें'}`,
            `Notes बनाएं: ${topic.keyPoints.slice(0, 2).join(', ')}`
          ],
          completed: false
        });
      }
    });
  }
  
  return tasks;
};

const generateDetailedWeeklyGoals = (examData: ExamPlanData) => {
  const startDate = new Date();
  const totalWeeks = Math.ceil(calculateDaysAvailable(examData.examDate) / 7);
  
  return Array.from({ length: Math.min(totalWeeks, 12) }, (_, week) => {
    const weekStart = new Date(startDate);
    weekStart.setDate(startDate.getDate() + (week * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return {
      week: week + 1,
      startDate: weekStart.toISOString().split('T')[0],
      endDate: weekEnd.toISOString().split('T')[0],
      subjects: examData.subjects.slice(0, Math.min(3, examData.subjects.length)),
      chapters: [`सप्ताह ${week + 1} के निर्धारित अध्याय`],
      targetCompletion: Math.min(100, (week + 1) * 12),
      focus: week === 0 ? "Foundation concepts और basic understanding का development" : 
             week < 4 ? "Core topics की detailed study और comprehensive notes बनाना" : 
             week < 8 ? "Advanced topics, problem solving, और application-based learning" :
             "Intensive revision, practice tests, और exam preparation",
      assessment: `सप्ताह ${week + 1} का comprehensive assessment और performance analysis`,
      detailedTargets: [
        `${examData.subjects[0]} के designated chapters को complete detailed understanding के साथ finish करना`,
        `हर topic के लिए structured notes बनाना और key points को highlight करना`,
        `Minimum 25-30 practice questions systematically solve करना`,
        `Memory techniques और shortcuts को implement करके retention optimize करना`,
        `Previous year questions के patterns को analyze करके exam readiness improve करना`
      ],
      studySchedule: [
        `Monday-Tuesday: ${examData.subjects[0]} के core topics - detailed study और note-making`,
        `Wednesday-Thursday: ${examData.subjects[1] || examData.subjects[0]} के important concepts और examples`,
        `Friday: Practice questions, problem-solving, और doubt clearing sessions`,
        `Saturday: Comprehensive revision और memory consolidation`,
        `Sunday: Assessment, performance analysis, और next week की planning`
      ]
    };
  });
};

const getEnhancedExamTips = (): string[] => [
  "हर chapter के लिए detailed summary notes बनाएं - key points, formulas, और important facts के साथ",
  "Daily study के साथ-साथ regular revision schedule भी maintain करें - 24 hours, 7 days, 30 days rule follow करें",
  "Previous year papers को timed manner में solve करें - actual exam conditions simulate करके",
  "Weak topics को identify करके उन पर extra time invest करें - targeted improvement के लिए",
  "Mock tests regularly लें और detailed performance analysis करें - strengths और weaknesses को track करें",
  "Important formulas, dates, और facts को flashcards में organize करें - quick revision के लिए",
  "Study groups में participate करें - peer learning और knowledge sharing के लिए",
  "Health और sleep cycle को properly maintain करें - optimal brain function के लिए",
  "Answer writing practice करें - proper structure, time management, और presentation skills develop करें",
  "Current affairs को regularly पढ़ें और static knowledge से connect करें - comprehensive understanding के लिए"
];

const getMotivationalQuotes = (): string[] => [
  "हर दिन का छोटा सा progress भी बड़ी सफलता की नींव है - consistency maintain करते रहें!",
  "जब आप detailed planning के साथ पढ़ते हैं, तो success automatically follow करती है",
  "आपकी मेहनत और systematic approach आपको जरूर desired results दिलाएगी",
  "Details पर focus करें - छोटी चीजें मिलकर बड़ा impact create करती हैं",
  "हर chapter को समझकर पढ़ें, रटकर नहीं - deep understanding ही lasting success देती है!",
  "Regular revision और practice के बिना कोई भी preparation incomplete है",
  "आपका discipline और dedication ही आपको top rank तक ले जाएगा",
  "Smart study with detailed planning > Long hours without direction"
];

const generateMilestones = (examData: ExamPlanData) => {
  const totalWeeks = Math.ceil(calculateDaysAvailable(examData.examDate) / 7);
  
  return Array.from({ length: Math.min(totalWeeks, 6) }, (_, index) => ({
    week: (index + 1) * 2,
    title: `Milestone ${index + 1} - ${index === 0 ? 'Foundation Complete' : 
                                          index === 1 ? 'Core Topics Mastered' : 
                                          index === 2 ? 'Advanced Understanding' :
                                          'Exam Ready'}`,
    description: `${index === 0 ? 'सभी subjects के foundation topics clear हो गए और basic understanding develop हो गई' : 
                   index === 1 ? 'Main chapters के core concepts master हो गए और detailed notes complete हो गए' : 
                   index === 2 ? 'Advanced topics की deep understanding और problem-solving skills develop हो गईं' :
                   'Complete syllabus revision हो गया और exam confidence achieve हो गया'} - comprehensive progress achieved`,
    reward: `Achievement बैज, motivation boost, और ${index < 2 ? 'special study material access' : 'mock test series unlock'}`,
    criteria: [
      "निर्धारित chapters को detailed understanding के साथ complete करना",
      "हर topic के comprehensive notes बनाना और regular revision करना",
      "Target practice questions को systematically solve करना",
      "Consistent daily study schedule maintain करना और progress track करना",
      "Weekly assessments को successfully clear करना और improvement show करना"
    ]
  }));
};
