export interface ChapterInfo {
  chapterNumber: number;
  chapterName: string;
  topics: string[];
  subTopics: string[];
  importance: 'high' | 'medium' | 'low';
  weightage: number;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedHours: number;
  studyMethods: string[];
}

export interface SubjectSyllabus {
  subjectName: string;
  totalMarks: number;
  examDuration: string;
  chapters: ChapterInfo[];
  importantFormulas?: string[];
  keyConceptsToFocus: string[];
  commonMistakes: string[];
  examTips: string[];
}

export interface ExamSyllabus {
  examName: string;
  boardName: string;
  className: string;
  examPattern: {
    totalMarks: number;
    duration: string;
    questionTypes: string[];
    markingScheme: string;
  };
  subjects: { [subjectName: string]: SubjectSyllabus };
}

// ✅ Updated Database: Fixed for Arts Stream and SSC CGL
export const SYLLABUS_DATABASE: { [examKey: string]: ExamSyllabus } = {
  'Bihar Board 12th': {
    examName: 'Bihar Board 12th',
    boardName: 'BSEB',
    className: '12th (Arts)',
    examPattern: {
      totalMarks: 100,
      duration: '3 hours 15 minutes',
      questionTypes: ['Objective (MCQ)', 'Short Answer', 'Long Answer'],
      markingScheme: 'No Negative Marking (Best 50/100 MCQs count)'
    },
    subjects: {
      'History': {
        subjectName: 'History',
        totalMarks: 100,
        examDuration: '3 hours',
        chapters: [
          {
            chapterNumber: 1,
            chapterName: 'Bricks, Beads and Bones (Harappan)',
            topics: ['Urban Planning', 'Trade', 'Social Differences', 'Script'],
            subTopics: ['Citadel', 'Lower Town', 'Drainage System', 'Seals'],
            importance: 'high',
            weightage: 10,
            difficulty: 'easy',
            estimatedHours: 8,
            studyMethods: ['Map Pointing', 'Timeline Chart', 'NCERT Reading']
          },
          {
            chapterNumber: 2,
            chapterName: 'Kings, Farmers and Towns',
            topics: ['Mahajanapadas', 'Mauryan Empire', 'Gupta Empire'],
            subTopics: ['Magadha', 'Asoka Inscriptions', 'Land Grants'],
            importance: 'high',
            weightage: 8,
            difficulty: 'medium',
            estimatedHours: 10,
            studyMethods: ['Dynasty Tree', 'Comparison Table']
          }
        ],
        keyConceptsToFocus: ['Chronology of Empires', 'Archaeological Sources'],
        commonMistakes: ['Confusing dates', 'Mixing Maurya and Gupta features'],
        examTips: ['Highlight years and names', 'Practice maps daily']
      },
      'Political Science': {
        subjectName: 'Political Science',
        totalMarks: 100,
        examDuration: '3 hours',
        chapters: [
          {
            chapterNumber: 1,
            chapterName: 'Challenges of Nation Building',
            topics: ['Partition', 'Integration of Princely States', 'Reorganization of States'],
            subTopics: ['Sardar Patel Role', 'Kashmir Issue', 'SRC 1956'],
            importance: 'high',
            weightage: 12,
            difficulty: 'medium',
            estimatedHours: 10,
            studyMethods: ['Debate', 'Note making', 'Flowcharts']
          }
        ],
        keyConceptsToFocus: ['Indian Constitution', 'Cold War Era', 'One Party Dominance'],
        commonMistakes: ['Wrong article numbers', 'Confusing NATO/SEATO details'],
        examTips: ['Use flowcharts for political hierarchies', 'Quote recent relevant events']
      }
    }
  },
  'SSC CGL': {
    examName: 'SSC CGL',
    boardName: 'SSC',
    className: 'Graduate Level',
    examPattern: {
      totalMarks: 200,
      duration: '60 minutes (Tier 1)',
      questionTypes: ['Objective (MCQ)'],
      markingScheme: '0.50 Negative Marking'
    },
    subjects: {
      'Quantitative Aptitude': {
        subjectName: 'Quantitative Aptitude',
        totalMarks: 50,
        examDuration: '15-20 mins (Ideal)',
        chapters: [
          {
            chapterNumber: 1,
            chapterName: 'Number System',
            topics: ['Divisibility', 'Remainder Theorem', 'LCM/HCF'],
            subTopics: ['Unit Digit', 'Factors', 'Simplification'],
            importance: 'high',
            weightage: 4,
            difficulty: 'medium',
            estimatedHours: 12,
            studyMethods: ['Shortcuts', 'Daily Quiz', 'Formula Memorization']
          }
        ],
        importantFormulas: ['Sum of n natural numbers = n(n+1)/2', 'Dividend = (Divisor × Quotient) + Remainder'],
        keyConceptsToFocus: ['Speed calculation', 'Basic Algebra', 'Unit digit methods'],
        commonMistakes: ['Calculation errors under pressure'],
        examTips: ['Learn tables up to 30', 'Skip time-consuming questions initially']
      },
      'General Awareness': {
        subjectName: 'General Awareness',
        totalMarks: 50,
        examDuration: '5-10 mins (Ideal)',
        chapters: [
          {
            chapterNumber: 1,
            chapterName: 'Indian History',
            topics: ['Ancient', 'Medieval', 'Modern History'],
            subTopics: ['Indus Valley', 'Mughal Period', 'Indian National Movement'],
            importance: 'high',
            weightage: 6,
            difficulty: 'medium',
            estimatedHours: 20,
            studyMethods: ['One-liner notes', 'Previous year questions (PYQ)']
          }
        ],
        keyConceptsToFocus: ['Current Affairs (Last 1 year)', 'Indian Constitution'],
        commonMistakes: ['Over-guessing in GK', 'Confusing similar sounding dynasties'],
        examTips: ['Focus more on Static GK and Science']
      }
    }
  }
};

// ✅ Core Functions: Exported correctly to fix build errors
export const getSyllabusForExam = (examName: string): ExamSyllabus | null => {
  return SYLLABUS_DATABASE[examName] || null;
};

export const getSubjectSyllabus = (examName: string, subjectName: string): SubjectSyllabus | null => {
  const examSyllabus = getSyllabusForExam(examName);
  return examSyllabus?.subjects[subjectName] || null;
};

// Helper for Levinshtein Distance (Used in validation)
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(matrix[j][i - 1] + 1, matrix[j - 1][i] + 1, matrix[j - 1][i - 1] + indicator);
    }
  }
  return matrix[str2.length][str1.length];
}

function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  if (longer.length === 0) return 1.0;
  return (longer.length - levenshteinDistance(longer, shorter)) / longer.length;
}

export const validateTopicsAgainstSyllabus = (examName: string, subjectName: string, topics: string[]) => {
  const subjectSyllabus = getSubjectSyllabus(examName, subjectName);
  if (!subjectSyllabus) return { validTopics: [], invalidTopics: topics, suggestions: [] };

  const allValidTopics = subjectSyllabus.chapters.flatMap(chapter => [...chapter.topics, ...chapter.subTopics]);
  const validTopics = topics.filter(topic => 
    allValidTopics.some(v => v.toLowerCase().includes(topic.toLowerCase()) || topic.toLowerCase().includes(v.toLowerCase()))
  );

  const invalidTopics = topics.filter(topic => !validTopics.includes(topic));
  const suggestions = invalidTopics.map(it => {
    const sim = allValidTopics.find(v => calculateSimilarity(it.toLowerCase(), v.toLowerCase()) > 0.6);
    return sim ? `"${it}" के बजाय "${sim}" देखें` : '';
  }).filter(Boolean);

  return { validTopics, invalidTopics, suggestions };
};
