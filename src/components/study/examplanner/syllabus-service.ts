
export interface SyllabusData {
  boardName: string;
  className: string;
  subjects: {
    [subjectName: string]: {
      chapters: ChapterData[];
      totalMarks: number;
      examDuration: string;
    };
  };
}

export interface ChapterData {
  chapterNumber: number;
  chapterName: string;
  topics: string[];
  weightage: number;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedHours: number;
}

// Popular boards ka syllabus data
const SYLLABUS_DATABASE: { [key: string]: SyllabusData } = {
  'Bihar Board 12th': {
    boardName: 'Bihar Board',
    className: '12th',
    subjects: {
      'Mathematics': {
        chapters: [
          {
            chapterNumber: 1,
            chapterName: 'Relations and Functions',
            topics: ['Types of Relations', 'Types of Functions', 'Composition of Functions', 'Inverse of a Function'],
            weightage: 8,
            difficulty: 'medium',
            estimatedHours: 12
          },
          {
            chapterNumber: 2,
            chapterName: 'Inverse Trigonometric Functions',
            topics: ['Definition', 'Range', 'Domain', 'Principal Values', 'Properties'],
            weightage: 4,
            difficulty: 'hard',
            estimatedHours: 8
          }
          // More chapters...
        ],
        totalMarks: 100,
        examDuration: '3 hours'
      },
      'Physics': {
        chapters: [
          {
            chapterNumber: 1,
            chapterName: 'Electric Charges and Fields',
            topics: ['Electric Charge', 'Conductors and Insulators', 'Coulombs Law', 'Electric Field'],
            weightage: 9,
            difficulty: 'medium',
            estimatedHours: 15
          }
          // More chapters...
        ],
        totalMarks: 70,
        examDuration: '3 hours'
      }
    }
  },
  'CBSE 12th': {
    boardName: 'CBSE',
    className: '12th',
    subjects: {
      'Mathematics': {
        chapters: [
          {
            chapterNumber: 1,
            chapterName: 'Relations and Functions',
            topics: ['Types of Relations', 'Types of Functions', 'Composition of Functions'],
            weightage: 8,
            difficulty: 'medium',
            estimatedHours: 12
          }
          // More chapters...
        ],
        totalMarks: 80,
        examDuration: '3 hours'
      }
    }
  }
};

export class SyllabusService {
  static getSyllabusData(examName: string): SyllabusData | null {
    return SYLLABUS_DATABASE[examName] || null;
  }

  static validateTopics(examName: string, subject: string, topics: string[]): {
    validTopics: string[];
    invalidTopics: string[];
    suggestions: string[];
  } {
    const syllabusData = this.getSyllabusData(examName);
    if (!syllabusData || !syllabusData.subjects[subject]) {
      return {
        validTopics: [],
        invalidTopics: topics,
        suggestions: ['सिलेबस की पुष्टि करें']
      };
    }

    const allValidTopics = syllabusData.subjects[subject].chapters
      .flatMap(chapter => chapter.topics);
    
    const validTopics = topics.filter(topic => 
      allValidTopics.some(validTopic => 
        validTopic.toLowerCase().includes(topic.toLowerCase()) ||
        topic.toLowerCase().includes(validTopic.toLowerCase())
      )
    );

    const invalidTopics = topics.filter(topic => !validTopics.includes(topic));
    
    const suggestions = invalidTopics.map(invalidTopic => {
      const similarTopic = allValidTopics.find(validTopic =>
        this.calculateSimilarity(invalidTopic, validTopic) > 0.6
      );
      return similarTopic ? `"${invalidTopic}" के बजाय "${similarTopic}" का उपयोग करें` : '';
    }).filter(Boolean);

    return { validTopics, invalidTopics, suggestions };
  }

  private static calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private static levenshteinDistance(str1: string, str2: string): number {
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

  static getChaptersByImportance(examName: string, subject: string): {
    high: ChapterData[];
    medium: ChapterData[];
    low: ChapterData[];
  } {
    const syllabusData = this.getSyllabusData(examName);
    if (!syllabusData || !syllabusData.subjects[subject]) {
      return { high: [], medium: [], low: [] };
    }

    const chapters = syllabusData.subjects[subject].chapters;
    return {
      high: chapters.filter(ch => ch.weightage >= 8),
      medium: chapters.filter(ch => ch.weightage >= 5 && ch.weightage < 8),
      low: chapters.filter(ch => ch.weightage < 5)
    };
  }
}
