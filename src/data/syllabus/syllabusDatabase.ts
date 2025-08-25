
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

// Comprehensive Syllabus Database
export const SYLLABUS_DATABASE: { [examKey: string]: ExamSyllabus } = {
  'Bihar Board 12th': {
    examName: 'Bihar Board 12th',
    boardName: 'Bihar Board',
    className: '12th',
    examPattern: {
      totalMarks: 100,
      duration: '3 hours',
      questionTypes: ['Objective (MCQ)', 'Short Answer', 'Long Answer'],
      markingScheme: '1/4 negative marking for MCQs'
    },
    subjects: {
      'Mathematics': {
        subjectName: 'Mathematics',
        totalMarks: 100,
        examDuration: '3 hours',
        chapters: [
          {
            chapterNumber: 1,
            chapterName: 'Relations and Functions',
            topics: ['Types of Relations', 'Types of Functions', 'Composition of Functions', 'Inverse of Functions'],
            subTopics: ['Reflexive Relations', 'Symmetric Relations', 'Transitive Relations', 'One-to-One Functions', 'Onto Functions'],
            importance: 'high',
            weightage: 8,
            difficulty: 'medium',
            estimatedHours: 12,
            studyMethods: ['Draw relation diagrams', 'Practice function mapping', 'Solve numerical problems', 'Make formula charts']
          },
          {
            chapterNumber: 2,
            chapterName: 'Inverse Trigonometric Functions',
            topics: ['Definition and Range', 'Domain and Principal Values', 'Properties of Inverse Trigonometric Functions'],
            subTopics: ['sin⁻¹x, cos⁻¹x, tan⁻¹x', 'Principal Value Branch', 'Graphs of Inverse Functions'],
            importance: 'high',
            weightage: 8,
            difficulty: 'hard',
            estimatedHours: 10,
            studyMethods: ['Memorize principal values', 'Draw graphs', 'Practice identity problems', 'Solve step-by-step']
          },
          {
            chapterNumber: 3,
            chapterName: 'Matrices',
            topics: ['Types of Matrices', 'Operations on Matrices', 'Determinants', 'Inverse of Matrix'],
            subTopics: ['Square Matrix', 'Row Matrix', 'Column Matrix', 'Addition and Multiplication', 'Adjoint Method'],
            importance: 'high',
            weightage: 10,
            difficulty: 'medium',
            estimatedHours: 15,
            studyMethods: ['Practice matrix calculations', 'Learn determinant shortcuts', 'Solve system of equations', 'Make property notes']
          },
          {
            chapterNumber: 4,
            chapterName: 'Determinants',
            topics: ['Properties of Determinants', 'Calculation Methods', 'Applications'],
            subTopics: ['Cofactor Expansion', 'Row and Column Operations', 'Cramer\'s Rule'],
            importance: 'high',
            weightage: 8,
            difficulty: 'medium',
            estimatedHours: 12,
            studyMethods: ['Practice expansion methods', 'Learn properties by heart', 'Solve application problems']
          }
        ],
        importantFormulas: [
          '|AB| = |A| × |B|',
          'A⁻¹ = (1/|A|) × adj(A)',
          'sin⁻¹x + cos⁻¹x = π/2'
        ],
        keyConceptsToFocus: ['Matrix inverse calculations', 'Determinant properties', 'Function composition'],
        commonMistakes: ['Wrong signs in determinants', 'Domain/range confusion in inverse functions'],
        examTips: ['Practice numerical problems daily', 'Memorize all formulas', 'Time management is crucial']
      },
      'Physics': {
        subjectName: 'Physics',
        totalMarks: 70,
        examDuration: '3 hours',
        chapters: [
          {
            chapterNumber: 1,
            chapterName: 'Electric Charges and Fields',
            topics: ['Electric Charge', 'Coulomb\'s Law', 'Electric Field', 'Electric Flux', 'Gauss\'s Law'],
            subTopics: ['Conservation of Charge', 'Superposition Principle', 'Electric Field Lines', 'Electric Dipole'],
            importance: 'high',
            weightage: 9,
            difficulty: 'medium',
            estimatedHours: 15,
            studyMethods: ['Understand concepts first', 'Practice numerical problems', 'Draw field diagrams', 'Learn derivations']
          },
          {
            chapterNumber: 2,
            chapterName: 'Electrostatic Potential and Capacitance',
            topics: ['Electric Potential', 'Potential Difference', 'Capacitors', 'Energy Stored'],
            subTopics: ['Potential due to Point Charge', 'Equipotential Surfaces', 'Parallel Plate Capacitor', 'Series and Parallel Combination'],
            importance: 'high',
            weightage: 8,
            difficulty: 'hard',
            estimatedHours: 14,
            studyMethods: ['Solve numerical problems', 'Understand energy concepts', 'Practice circuit problems']
          }
        ],
        importantFormulas: [
          'F = kq₁q₂/r²',
          'E = F/q',
          'V = kq/r',
          'C = Q/V'
        ],
        keyConceptsToFocus: ['Electric field calculations', 'Potential energy', 'Capacitor combinations'],
        commonMistakes: ['Sign confusion in charges', 'Units conversion errors'],
        examTips: ['Draw diagrams for better understanding', 'Practice derivations', 'Focus on numerical problems']
      },
      'Chemistry': {
        subjectName: 'Chemistry',
        totalMarks: 70,
        examDuration: '3 hours',
        chapters: [
          {
            chapterNumber: 1,
            chapterName: 'The Solid State',
            topics: ['Crystal Lattices', 'Unit Cells', 'Packing Efficiency', 'Imperfections in Solids'],
            subTopics: ['Simple Cubic', 'Body-Centered Cubic', 'Face-Centered Cubic', 'Schottky and Frenkel Defects'],
            importance: 'medium',
            weightage: 6,
            difficulty: 'medium',
            estimatedHours: 10,
            studyMethods: ['Visualize crystal structures', 'Calculate packing efficiency', 'Practice numerical problems']
          },
          {
            chapterNumber: 2,
            chapterName: 'Solutions',
            topics: ['Types of Solutions', 'Concentration Terms', 'Solubility', 'Colligative Properties'],
            subTopics: ['Molarity', 'Molality', 'Mole Fraction', 'Raoult\'s Law', 'Osmotic Pressure'],
            importance: 'high',
            weightage: 8,
            difficulty: 'medium',
            estimatedHours: 12,
            studyMethods: ['Practice concentration problems', 'Understand colligative properties', 'Solve numerical examples']
          }
        ],
        importantFormulas: [
          'Molarity = moles of solute/volume in L',
          'Molality = moles of solute/kg of solvent',
          'ΔTf = Kf × m',
          'π = CRT'
        ],
        keyConceptsToFocus: ['Concentration calculations', 'Colligative properties', 'Crystal structures'],
        commonMistakes: ['Molarity vs Molality confusion', 'Unit conversion errors'],
        examTips: ['Focus on numerical problems', 'Understand concepts before memorizing', 'Practice regularly']
      },
      'History': {
        subjectName: 'History',
        totalMarks: 100,
        examDuration: '3 hours',
        chapters: [
          {
            chapterNumber: 1,
            chapterName: 'Bricks, Beads and Bones (Harappan Civilization)',
            topics: ['Harappan Cities', 'Social and Economic Life', 'Religious Practices', 'Decline of Harappan Civilization'],
            subTopics: ['Dholavira', 'Kalibangan', 'Lothal', 'Trade and Commerce', 'Script and Seals'],
            importance: 'high',
            weightage: 8,
            difficulty: 'easy',
            estimatedHours: 8,
            studyMethods: ['Read NCERT thoroughly', 'Make timeline charts', 'Practice map work', 'Note important sites']
          },
          {
            chapterNumber: 2,
            chapterName: 'Kings, Farmers and Towns (Early States and Economies)',
            topics: ['Mahajanapadas', 'Agriculture', 'Towns and Trade', 'Money and Minting'],
            subTopics: ['16 Mahajanapadas', 'Iron Tools', 'Northern Black Polished Ware', 'Punch-marked Coins'],
            importance: 'medium',
            weightage: 6,
            difficulty: 'easy',
            estimatedHours: 7,
            studyMethods: ['Make charts of Mahajanapadas', 'Understand economic changes', 'Note technological developments']
          }
        ],
        keyConceptsToFocus: ['Harappan urban planning', 'Early state formation', 'Economic developments'],
        commonMistakes: ['Confusing different civilizations', 'Wrong chronology'],
        examTips: ['Read NCERT multiple times', 'Make short notes', 'Practice answer writing', 'Focus on dates and events']
      }
    }
  },
  'SSC CGL': {
    examName: 'SSC CGL',
    boardName: 'Staff Selection Commission',
    className: 'Graduate Level',
    examPattern: {
      totalMarks: 200,
      duration: '1 hour each tier',
      questionTypes: ['Multiple Choice Questions'],
      markingScheme: '0.50 negative marking'
    },
    subjects: {
      'General Intelligence & Reasoning': {
        subjectName: 'General Intelligence & Reasoning',
        totalMarks: 50,
        examDuration: '1 hour',
        chapters: [
          {
            chapterNumber: 1,
            chapterName: 'Analogies',
            topics: ['Letter Analogies', 'Number Analogies', 'Mixed Analogies'],
            subTopics: ['Word to Word Relation', 'Letter to Letter Relation', 'Number to Number Relation'],
            importance: 'high',
            weightage: 8,
            difficulty: 'easy',
            estimatedHours: 5,
            studyMethods: ['Practice daily', 'Identify patterns', 'Time yourself', 'Learn shortcuts']
          },
          {
            chapterNumber: 2,
            chapterName: 'Series',
            topics: ['Number Series', 'Letter Series', 'Alpha-Numeric Series'],
            subTopics: ['Arithmetic Progression', 'Geometric Progression', 'Mixed Series'],
            importance: 'high',
            weightage: 10,
            difficulty: 'medium',
            estimatedHours: 8,
            studyMethods: ['Identify patterns quickly', 'Practice different types', 'Use elimination method']
          }
        ],
        keyConceptsToFocus: ['Pattern recognition', 'Quick calculation', 'Logical thinking'],
        commonMistakes: ['Rushing through questions', 'Not checking options carefully'],
        examTips: ['Practice speed and accuracy', 'Don\'t spend too much time on one question']
      }
    }
  }
};

export const getSyllabusForExam = (examName: string): ExamSyllabus | null => {
  return SYLLABUS_DATABASE[examName] || null;
};

export const getSubjectSyllabus = (examName: string, subjectName: string): SubjectSyllabus | null => {
  const examSyllabus = getSyllabusForExam(examName);
  return examSyllabus?.subjects[subjectName] || null;
};

export const validateTopicsAgainstSyllabus = (examName: string, subjectName: string, topics: string[]): {
  validTopics: string[];
  invalidTopics: string[];
  suggestions: string[];
} => {
  const subjectSyllabus = getSubjectSyllabus(examName, subjectName);
  
  if (!subjectSyllabus) {
    return {
      validTopics: [],
      invalidTopics: topics,
      suggestions: ['Syllabus not available for this exam/subject combination']
    };
  }

  const allValidTopics = subjectSyllabus.chapters.flatMap(chapter => [
    ...chapter.topics,
    ...chapter.subTopics
  ]);

  const validTopics = topics.filter(topic =>
    allValidTopics.some(validTopic =>
      validTopic.toLowerCase().includes(topic.toLowerCase()) ||
      topic.toLowerCase().includes(validTopic.toLowerCase())
    )
  );

  const invalidTopics = topics.filter(topic => !validTopics.includes(topic));
  
  const suggestions = invalidTopics.map(invalidTopic => {
    const similarTopic = allValidTopics.find(validTopic =>
      calculateSimilarity(invalidTopic.toLowerCase(), validTopic.toLowerCase()) > 0.6
    );
    return similarTopic ? `"${invalidTopic}" के बजाय "${similarTopic}" का उपयोग करें` : '';
  }).filter(Boolean);

  return { validTopics, invalidTopics, suggestions };
};

function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}
