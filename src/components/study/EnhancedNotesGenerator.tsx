
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  BookOpen, 
  Download, 
  Star,
  Brain,
  Lightbulb,
  Target,
  Copy,
  Share2
} from 'lucide-react';
import { toast } from 'sonner';
import { generateResponse } from '@/lib/gemini';
import { useNotesHistory } from '@/hooks/useNotesHistory';

interface EnhancedNotesGeneratorProps {
  onSendMessage: (msg: string) => void;
}

interface GeneratedNote {
  id: string;
  title: string;
  subject: string;
  topic: string;
  noteType: string;
  content: string;
  keyPoints: string[];
  timestamp: string;
  isFavorite: boolean;
}

const EnhancedNotesGenerator: React.FC<EnhancedNotesGeneratorProps> = ({ onSendMessage }) => {
  const navigate = useNavigate();
  const { notes: savedNotes, saveNote, deleteNote } = useNotesHistory();
  const [selectedSubject, setSelectedSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('hindi');
  const [customRequirements, setCustomRequirements] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedNotes, setGeneratedNotes] = useState<GeneratedNote[]>([]);
  const [currentNote, setCurrentNote] = useState<GeneratedNote | null>(null);

  const subjects = [
    'गणित (Mathematics)', 'भौतिक विज्ञान (Physics)', 'रसायन विज्ञान (Chemistry)', 
    'जीव विज्ञान (Biology)', 'हिंदी (Hindi)', 'अंग्रेजी (English)', 
    'इतिहास (History)', 'भूगोल (Geography)', 'राजनीति विज्ञान (Political Science)',
    'अर्थशास्त्र (Economics)', 'समाजशास्त्र (Sociology)', 'कंप्यूटर साइंस (Computer Science)'
  ];

  const classes = [
    'कक्षा 6', 'कक्षा 7', 'कक्षा 8', 'कक्षा 9', 'कक्षा 10',
    'कक्षा 11', 'कक्षा 12', 'स्नातक (Graduation)', 'अन्य (Other)'
  ];


  const generateSmartPrompt = (subject: string, chapter: string, className: string, language: string, requirements: string) => {
    const languageInstruction = language === 'hindi' 
      ? 'कृपया पूरे notes हिंदी में लिखें। सभी technical terms के साथ हिंदी अनुवाद भी दें।'
      : language === 'english'
      ? 'Please write the entire notes in English. Keep the language simple and easy to understand.'
      : 'कृपया notes हिंदी और English दोनों भाषाओं का mixed use करें, जैसा students comfortable हैं।';

    let basePrompt = `आप एक expert teacher हैं। ${className} के लिए ${subject} विषय के "${chapter}" chapter पर विस्तृत और high-quality study notes बनाएं।

${languageInstruction}

Notes में ये सभी sections शामिल करें:

📚 **Chapter Overview**
- Chapter का introduction और importance
- Main topics की list

📝 **Detailed Content**
- हर topic को step-by-step explain करें
- Important definitions और concepts
- Formulas और equations (अगर applicable हो)
- Diagrams की detailed description
- Real-life examples और applications

💡 **Key Points**
- Chapter के सबसे important points
- याद रखने के लिए tricks और mnemonics
- Common mistakes से बचने के tips

📊 **Practice Questions**
- Short answer questions (3-4)
- Long answer questions (2-3)
- MCQs (5-6)

📖 **Summary**
- Chapter का quick revision summary
- Important formulas की list (अगर applicable हो)`;

    if (requirements.trim()) {
      basePrompt += `\n\n**अतिरिक्त आवश्यकताएं:**\n${requirements}`;
    }

    basePrompt += `\n\nNotes को professional, organized और student-friendly format में बनाएं। Headings, subheadings, bullet points, और numbering का proper use करें।`;

    return basePrompt;
  };

  const generateNotes = async () => {
    if (!selectedSubject || !chapter.trim() || !selectedClass) {
      toast.error('कृपया विषय, अध्याय और कक्षा भरें');
      return;
    }

    setIsGenerating(true);
    
    try {
      const prompt = generateSmartPrompt(selectedSubject, chapter, selectedClass, selectedLanguage, customRequirements);
      const content = await generateResponse(prompt);

      // Extract key points from the generated content
      const keyPoints = extractKeyPoints(content);

      const newNote: GeneratedNote = {
        id: Date.now().toString(),
        title: `${selectedSubject} - ${chapter}`,
        subject: selectedSubject,
        topic: chapter,
        noteType: selectedClass,
        content: content,
        keyPoints: keyPoints,
        timestamp: new Date().toISOString(),
        isFavorite: false
      };

      setGeneratedNotes([newNote, ...generatedNotes.slice(0, 9)]);
      setCurrentNote(newNote);
      
      // Save to localStorage history
      saveNote({
        title: newNote.title,
        subject: selectedSubject,
        chapter: chapter,
        class: selectedClass,
        language: selectedLanguage,
        content: content,
        keyPoints: keyPoints
      });
      
      // Clear form
      setChapter('');
      setCustomRequirements('');
      
      toast.success('📝 उच्च गुणवत्ता के Notes तैयार और सहेजे गए!');
      
      // Navigate to notes view page
      navigate('/notes-view', { state: { note: newNote } });
    } catch (error) {
      console.error('Error generating notes:', error);
      toast.error('Notes generate करने में error आया');
    } finally {
      setIsGenerating(false);
    }
  };

  const extractKeyPoints = (content: string): string[] => {
    const points: string[] = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')) {
        points.push(line.trim().substring(1).trim());
      } else if (line.includes('important') || line.includes('महत्वपूर्ण') || line.includes('key')) {
        points.push(line.trim());
      }
    }
    
    return points.slice(0, 5); // Top 5 key points
  };


  const toggleFavorite = (noteId: string) => {
    setGeneratedNotes(generatedNotes.map(note => 
      note.id === noteId ? { ...note, isFavorite: !note.isFavorite } : note
    ));
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Notes clipboard में copy हो गए!');
  };

  const downloadNotes = (note: GeneratedNote) => {
    const element = document.createElement('a');
    const file = new Blob([note.content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${note.title}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Notes download हो गए!');
  };

  return (
    <div className="space-y-6 p-4">
      {/* Notes Generator */}
      <Card className="border-2 border-blue-200 dark:border-blue-800 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-6 w-6" />
            📝 AI Notes Generator - उच्च गुणवत्ता के Study Notes बनाएं
          </CardTitle>
          <p className="text-sm text-blue-100 mt-1">विस्तृत, organized और exam-ready notes तुरंत बनाएं</p>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold mb-2 block text-gray-700 dark:text-gray-300">
                📚 विषय चुनें *
              </label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="border-2 border-blue-300 dark:border-blue-700">
                  <SelectValue placeholder="अपना विषय चुनें" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block text-gray-700 dark:text-gray-300">
                📖 अध्याय/टॉपिक का नाम *
              </label>
              <Input
                placeholder="जैसे: द्विघात समीकरण, प्रकाश संश्लेषण..."
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                className="border-2 border-blue-300 dark:border-blue-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold mb-2 block text-gray-700 dark:text-gray-300">
                🎓 कक्षा *
              </label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="border-2 border-purple-300 dark:border-purple-700">
                  <SelectValue placeholder="अपनी कक्षा चुनें" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(cls => (
                    <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block text-gray-700 dark:text-gray-300">
                🌐 भाषा चुनें *
              </label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="border-2 border-purple-300 dark:border-purple-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hindi">🇮🇳 हिंदी (Hindi)</SelectItem>
                  <SelectItem value="english">🇬🇧 अंग्रेजी (English)</SelectItem>
                  <SelectItem value="mixed">🔀 मिक्स (Hindi + English)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block text-gray-700 dark:text-gray-300">
              📝 अतिरिक्त आवश्यकताएं (Optional)
            </label>
            <Textarea
              placeholder="जैसे: Diagrams की detail चाहिए, Numerical problems focus करें, Memory tricks add करें, Previous year questions include करें..."
              value={customRequirements}
              onChange={(e) => setCustomRequirements(e.target.value)}
              rows={3}
              className="border-2 border-green-300 dark:border-green-700"
            />
          </div>

          <Button 
            onClick={generateNotes} 
            disabled={isGenerating}
            className="w-full py-6 text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                🚀 AI आपके Notes बना रहा है...
              </>
            ) : (
              <>
                <Brain className="h-5 w-5 mr-2" />
                ✨ High-Quality Notes Generate करें
              </>
            )}
          </Button>
          
          <div className="text-xs text-center text-gray-500 dark:text-gray-400">
            💡 Tip: सभी fields सही से भरें ताकि best quality notes मिलें
          </div>
        </CardContent>
      </Card>

      {/* Current Generated Notes */}
      {currentNote && (
        <Card className="border-2 border-green-300 dark:border-green-700 shadow-2xl bg-gradient-to-br from-white via-green-50 to-blue-50 dark:from-gray-800 dark:via-green-900/20 dark:to-blue-900/20">
          <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white pb-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2 text-2xl mb-2">
                  <BookOpen className="h-6 w-6" />
                  📚 {currentNote.title}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge className="bg-white/20 text-white border-white/30">{currentNote.subject}</Badge>
                  <Badge className="bg-white/20 text-white border-white/30">{currentNote.noteType}</Badge>
                  <Badge className="bg-white/20 text-white border-white/30">
                    {new Date(currentNote.timestamp).toLocaleDateString('hi-IN')}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleFavorite(currentNote.id)}
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                >
                  <Star className={`h-4 w-4 ${currentNote.isFavorite ? 'fill-yellow-300 text-yellow-300' : ''}`} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(currentNote.content)}
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                  title="Copy to Clipboard"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadNotes(currentNote)}
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                  title="Download Notes"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Key Points Summary */}
            {currentNote.keyPoints.length > 0 && (
              <div className="mb-6 p-5 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border-2 border-yellow-300 dark:border-yellow-700 shadow-md">
                <h4 className="font-bold text-lg flex items-center gap-2 mb-3 text-yellow-800 dark:text-yellow-300">
                  <Target className="h-5 w-5" />
                  ⭐ मुख्य बिंदु (Key Points)
                </h4>
                <ul className="space-y-2">
                  {currentNote.keyPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm">
                      <span className="text-yellow-600 dark:text-yellow-400 font-bold text-lg">•</span>
                      <span className="text-gray-800 dark:text-gray-200">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Full Notes Content */}
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <ScrollArea className="h-[600px]">
                <div className="whitespace-pre-wrap p-6 bg-white dark:bg-gray-800 rounded-xl shadow-inner border border-gray-200 dark:border-gray-700 leading-relaxed text-base">
                  <style>
                    {`
                      .prose h1, .prose h2, .prose h3 { 
                        color: #2563eb; 
                        font-weight: bold; 
                        margin-top: 1.5rem;
                        margin-bottom: 0.75rem;
                      }
                      .prose h1 { font-size: 1.75rem; }
                      .prose h2 { font-size: 1.5rem; }
                      .prose h3 { font-size: 1.25rem; }
                      .prose p { margin-bottom: 1rem; line-height: 1.8; }
                      .prose ul, .prose ol { margin-left: 1.5rem; margin-bottom: 1rem; }
                      .prose li { margin-bottom: 0.5rem; }
                      .prose strong { color: #059669; font-weight: 700; }
                      .prose code { 
                        background: #f3f4f6; 
                        padding: 0.2rem 0.4rem; 
                        border-radius: 0.25rem;
                        font-size: 0.9em;
                      }
                    `}
                  </style>
                  {currentNote.content}
                </div>
              </ScrollArea>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-300 text-center">
                💡 <strong>Tip:</strong> Copy button से notes copy करें या Download button से save करें
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Notes History */}
      {savedNotes.length > 0 && (
        <Card className="border-2 border-purple-200 dark:border-purple-800">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              📚 सहेजे गए Notes की History
            </CardTitle>
            <p className="text-sm text-purple-100 mt-1">आपके सभी पिछले notes यहाँ सुरक्षित हैं</p>
          </CardHeader>
          <CardContent className="p-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {savedNotes.map((note) => (
                  <div key={note.id} className="border-2 rounded-lg p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-bold text-base flex items-center gap-2 text-purple-800 dark:text-purple-300 mb-2">
                          📖 {note.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge className="bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-200 text-xs">
                            {note.subject}
                          </Badge>
                          <Badge className="bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200 text-xs">
                            {note.class}
                          </Badge>
                          <Badge className="bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200 text-xs">
                            {note.language === 'hindi' ? '🇮🇳 हिंदी' : note.language === 'english' ? '🇬🇧 English' : '🔀 Mixed'}
                          </Badge>
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            📅 {new Date(note.timestamp).toLocaleDateString('hi-IN', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const noteToView = {
                              id: note.id,
                              title: note.title,
                              subject: note.subject,
                              topic: note.chapter,
                              noteType: note.class,
                              content: note.content,
                              keyPoints: note.keyPoints,
                              timestamp: new Date(note.timestamp).toISOString(),
                              isFavorite: false
                            };
                            navigate('/notes-view', { state: { note: noteToView } });
                          }}
                          className="bg-purple-100 hover:bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-200"
                        >
                          👁️ देखें
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const element = document.createElement('a');
                            const file = new Blob([note.content], { type: 'text/plain' });
                            element.href = URL.createObjectURL(file);
                            element.download = `${note.title}.txt`;
                            document.body.appendChild(element);
                            element.click();
                            document.body.removeChild(element);
                            toast.success('📥 Notes download हो गए!');
                          }}
                          className="bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            if (confirm('क्या आप इस note को delete करना चाहते हैं?')) {
                              deleteNote(note.id);
                              toast.success('🗑️ Note delete हो गया!');
                            }
                          }}
                          className="bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200"
                        >
                          🗑️
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedNotesGenerator;
