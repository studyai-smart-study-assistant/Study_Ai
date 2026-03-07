export const SYLLABUS_DATABASE: { [examKey: string]: ExamSyllabus } = {
  'Bihar Board 12th': {
    examName: 'Bihar Board 12th',
    boardName: 'BSEB',
    className: '12th',
    examPattern: {
      totalMarks: 100,
      duration: '3 hours 15 minutes', // 15 mins extra for reading
      questionTypes: ['Objective (50%)', 'Short Answer', 'Long Answer'],
      markingScheme: 'No Negative Marking (50/100 MCQs to be attempted)' // Corrected
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
            weightage: 6,
            difficulty: 'easy',
            estimatedHours: 6,
            studyMethods: ['Map Pointing', 'Timeline Chart', 'NCERT Reading']
          },
          {
            chapterNumber: 2,
            chapterName: 'Kings, Farmers and Towns',
            topics: ['Mahajanapadas', 'Mauryan Empire', 'Gupta Empire'],
            subTopics: ['Magadha', 'Asoka Inscriptions', 'Land Grants'],
            importance: 'high',
            weightage: 5,
            difficulty: 'medium',
            estimatedHours: 8,
            studyMethods: ['Dynasty Tree', 'Comparison Table']
          }
          // Add more chapters here...
        ],
        keyConceptsToFocus: ['Chronology of Empires', 'Archeological Sources'],
        commonMistakes: ['Confusing dates', 'Mixing Maurya and Gupta features'],
        examTips: ['Highlight years and names', 'Practice maps']
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
            weightage: 8,
            difficulty: 'medium',
            estimatedHours: 10,
            studyMethods: ['Debate', 'Documentary watching', 'Note making']
          }
        ],
        keyConceptsToFocus: ['Indian Constitution', 'Cold War Era', 'One Party Dominance'],
        commonMistakes: ['Writing wrong article numbers', 'Confusing NATO/SEATO'],
        examTips: ['Use flowcharts for political hierarchies', 'Quote recent events']
      }
      // Note: Math/Physics were in your code but you are an Arts student. 
      // I kept History and added Political Science.
    }
  },
  'SSC CGL': {
    // SSC CGL Tier 1 Pattern
    examName: 'SSC CGL',
    boardName: 'SSC',
    className: 'Graduate Level',
    examPattern: {
      totalMarks: 200,
      duration: '60 minutes',
      questionTypes: ['Objective (MCQ)'],
      markingScheme: '0.50 Negative Marking' // Correct for Tier 1
    },
    subjects: {
      'Quantitative Aptitude': {
        subjectName: 'Math (Quant)',
        totalMarks: 50,
        chapters: [
          {
            chapterNumber: 1,
            chapterName: 'Number System',
            topics: ['Divisibility', 'Remainder Theorem', 'LCM/HCF'],
            subTopics: ['Unit Digit', 'Factors'],
            importance: 'high',
            weightage: 4,
            difficulty: 'medium',
            estimatedHours: 12,
            studyMethods: ['Shortcuts', 'Daily Quiz']
          }
        ],
        importantFormulas: ['Sum of n numbers = n(n+1)/2'],
        keyConceptsToFocus: ['Speed calculation', 'Standard Identities'],
        commonMistakes: ['Calculation errors under pressure'],
        examTips: ['Skip time-consuming questions', 'Learn tables up to 30']
      }
    }
  }
};
