
import React, { useState } from 'react';
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
  const [noteTitle, setNoteTitle] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [noteType, setNoteType] = useState('comprehensive');
  const [customRequirements, setCustomRequirements] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedNotes, setGeneratedNotes] = useState<GeneratedNote[]>([]);
  const [currentNote, setCurrentNote] = useState<GeneratedNote | null>(null);

  const subjects = [
    'गणित', 'भौतिक विज्ञान', 'रसायन विज्ञान', 'जीव विज्ञान',
    'हिंदी', 'अंग्रेजी', 'इतिहास', 'भूगोल', 'राजनीति विज्ञान',
    'अर्थशास्त्र', 'समाजशास्त्र', 'कंप्यूटर साइंस'
  ];

  const noteTypes = [
    { value: 'comprehensive', label: 'Comprehensive Notes', description: 'विस्तृत और complete notes' },
    { value: 'quick-revision', label: 'Quick Revision', description: 'जल्दी revision के लिए' },
    { value: 'exam-focused', label: 'Exam Focused', description: 'परीक्षा के लिए important points' },
    { value: 'concept-explanation', label: 'Concept Explanation', description: 'Concepts को समझने के लिए' },
    { value: 'formula-summary', label: 'Formula Summary', description: 'सभी formulas और equations' }
  ];

  const smartTemplates = [
    { subject: 'गणित', topic: 'Quadratic Equations', type: 'formula-summary' },
    { subject: 'भौतिक विज्ञान', topic: 'Laws of Motion', type: 'concept-explanation' },
    { subject: 'रसायन विज्ञान', topic: 'Periodic Table', type: 'comprehensive' },
    { subject: 'जीव विज्ञान', topic: 'Photosynthesis', type: 'exam-focused' },
    { subject: 'इतिहास', topic: 'Mughal Empire', type: 'quick-revision' }
  ];

  const generateSmartPrompt = (title: string, subject: string, topic: string, type: string, requirements: string) => {
    let basePrompt = '';
    
    switch (type) {
      case 'comprehensive':
        basePrompt = `${subject} के topic "${topic}" पर comprehensive notes बनाएं। सभी important concepts, definitions, examples और applications include करें।`;
        break;
      case 'quick-revision':
        basePrompt = `${subject} के topic "${topic}" के लिए quick revision notes बनाएं। केवल most important points, key formulas और facts include करें।`;
        break;
      case 'exam-focused':
        basePrompt = `${subject} के topic "${topic}" के लिए exam-focused notes बनाएं। Previous year questions patterns, important questions और exam tips include करें।`;
        break;
      case 'concept-explanation':
        basePrompt = `${subject} के topic "${topic}" को step-by-step explain करें। Basic concepts से advanced level तक, examples के साथ।`;
        break;
      case 'formula-summary':
        basePrompt = `${subject} के topic "${topic}" के सभी important formulas, equations और derivations को organized format में present करें।`;
        break;
    }

    if (requirements.trim()) {
      basePrompt += ` Additional requirements: ${requirements}`;
    }

    basePrompt += `
    
    Please format the notes with:
    1. Clear headings और subheadings
    2. Important points को bullet format में
    3. Key formulas को highlight करें
    4. Examples जहां जरूरी हो
    5. Summary section अंत में
    
    Language: Hindi और English mixed (जैसा students prefer करते हैं)`;

    return basePrompt;
  };

  const generateNotes = async () => {
    if (!noteTitle.trim() || !selectedSubject || !topic.trim()) {
      toast.error('कृपया सभी required fields भरें');
      return;
    }

    setIsGenerating(true);
    
    try {
      const prompt = generateSmartPrompt(noteTitle, selectedSubject, topic, noteType, customRequirements);
      const content = await generateResponse(prompt);

      // Extract key points from the generated content
      const keyPoints = extractKeyPoints(content);

      const newNote: GeneratedNote = {
        id: Date.now().toString(),
        title: noteTitle,
        subject: selectedSubject,
        topic: topic,
        noteType: noteType,
        content: content,
        keyPoints: keyPoints,
        timestamp: new Date().toISOString(),
        isFavorite: false
      };

      setGeneratedNotes([newNote, ...generatedNotes.slice(0, 9)]);
      setCurrentNote(newNote);
      
      // Clear form
      setNoteTitle('');
      setTopic('');
      setCustomRequirements('');
      
      toast.success('📝 Smart Notes तैयार हैं!');
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

  const useTemplate = (template: typeof smartTemplates[0]) => {
    setSelectedSubject(template.subject);
    setTopic(template.topic);
    setNoteType(template.type);
    setNoteTitle(`${template.subject} - ${template.topic}`);
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
    <div className="space-y-6">
      {/* Smart Templates */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <Lightbulb className="h-5 w-5" />
            Smart Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {smartTemplates.map((template, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={() => useTemplate(template)}
                className="p-3 h-auto flex flex-col items-start"
              >
                <div className="font-medium text-sm">{template.subject}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{template.topic}</div>
                <Badge variant="secondary" className="mt-1 text-xs">
                  {noteTypes.find(t => t.value === template.type)?.label}
                </Badge>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notes Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Enhanced Notes Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Notes Title</label>
              <Input
                placeholder="जैसे: Algebra Basics, Chemical Bonding..."
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">विषय</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="विषय चुनें" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Topic/Chapter</label>
              <Input
                placeholder="जैसे: Quadratic Equations, Photosynthesis..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Notes Type</label>
              <Select value={noteType} onValueChange={setNoteType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {noteTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-gray-500">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Additional Requirements (Optional)</label>
            <Textarea
              placeholder="जैसे: Include diagrams description, Focus on numerical problems, Add memory tricks..."
              value={customRequirements}
              onChange={(e) => setCustomRequirements(e.target.value)}
              rows={2}
            />
          </div>

          <Button 
            onClick={generateNotes} 
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                AI Notes बना रहा है...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Smart Notes Generate करें
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Current Generated Notes */}
      {currentNote && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <BookOpen className="h-5 w-5" />
                  {currentNote.title}
                </CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary">{currentNote.subject}</Badge>
                  <Badge variant="outline">{currentNote.topic}</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleFavorite(currentNote.id)}
                >
                  <Star className={`h-4 w-4 ${currentNote.isFavorite ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(currentNote.content)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadNotes(currentNote)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Key Points Summary */}
            {currentNote.keyPoints.length > 0 && (
              <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-green-500" />
                  Key Points
                </h4>
                <ul className="text-sm space-y-1">
                  {currentNote.keyPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-500">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Full Notes Content */}
            <div className="prose dark:prose-invert max-w-none">
              <ScrollArea className="h-[400px]">
                <div className="whitespace-pre-wrap text-sm p-3 bg-white dark:bg-gray-800 rounded-lg">
                  {currentNote.content}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes History */}
      {generatedNotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Generated Notes History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {generatedNotes.map(note => (
                  <div key={note.id} className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          {note.title}
                          {note.isFavorite && <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">{note.subject}</Badge>
                          <Badge variant="outline" className="text-xs">{note.topic}</Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(note.timestamp).toLocaleDateString('hi-IN')}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setCurrentNote(note)}
                        >
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => downloadNotes(note)}
                        >
                          <Download className="h-3 w-3" />
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
