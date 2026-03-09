
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  Download, 
  Sparkles,
  Globe,
  Trash2,
  Eye,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { generateResponseWithSearch } from '@/lib/gemini';
import { useNotesHistory } from '@/hooks/useNotesHistory';
import { generateNotesPdf } from '@/utils/generateNotesPdf';

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
  const [topic, setTopic] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('hindi');
  const [isGenerating, setIsGenerating] = useState(false);

  const classes = [
    'Class 9', 'Class 10', 'Class 11', 'Class 12', 
    'SSC CGL', 'UPSC', 'Bihar Board', 'Other'
  ];

  const generateTopperPrompt = (topicName: string, className: string, language: string) => {
    const langInst = language === 'hindi' 
      ? 'Notes हिंदी में लिखें, technical terms English में रखें।'
      : language === 'english'
      ? 'Write notes in simple English.'
      : 'Mix Hindi and English naturally.';

    return `You are creating TOPPER-STYLE study notes. Be CONCISE and EXAM-FOCUSED.

Topic: "${topicName}"
Level: ${className}
Language: ${langInst}

FORMAT (follow strictly):
## 📌 ${topicName}

### 🎯 Key Points (5-7 bullet points max)
- Most important facts only
- Exam-relevant points
- Easy to memorize

### 📝 Quick Summary (3-4 paragraphs max)
Explain the core concept briefly. No fluff.

### 💡 Remember This
- Mnemonics or tricks to remember
- Common exam questions pattern

### ❓ Quick Practice (3 MCQs)
Q1: [Question]
a) b) c) d)
Answer: [X]

RULES:
- Be CONCISE like a topper's handwritten notes
- NO lengthy explanations
- Focus on EXAM-IMPORTANT content only
- Use bullet points, not paragraphs where possible
- Include latest/updated information`;
  };

  const generateNotes = async () => {
    if (!topic.trim()) {
      toast.error('Topic/अध्याय का नाम लिखें');
      return;
    }

    setIsGenerating(true);
    
    try {
      const prompt = generateTopperPrompt(topic, selectedClass || 'General', selectedLanguage);
      
      onSendMessage(prompt);
      
      // Use web search for latest information
      const result = await generateResponseWithSearch(
        prompt, 
        [], 
        undefined, 
        'google/gemini-2.5-flash',
        true // Force web search for latest info
      );

      const content = result.text;
      const keyPoints = extractKeyPoints(content);

      const newNote: GeneratedNote = {
        id: Date.now().toString(),
        title: topic,
        subject: selectedClass || 'General',
        topic: topic,
        noteType: selectedClass || 'General',
        content: content,
        keyPoints: keyPoints,
        timestamp: new Date().toISOString(),
        isFavorite: false
      };
      
      // Save to history
      saveNote({
        title: newNote.title,
        subject: newNote.subject,
        chapter: topic,
        class: selectedClass || 'General',
        language: selectedLanguage,
        content: content,
        keyPoints: keyPoints
      });
      
      setTopic('');
      
      toast.success('📝 Topper-style Notes तैयार!');
      
      navigate('/notes-ad', { state: { note: newNote } });
    } catch (error) {
      console.error('Error generating notes:', error);
      toast.error('Notes generate करने में error');
    } finally {
      setIsGenerating(false);
    }
  };

  const extractKeyPoints = (content: string): string[] => {
    const points: string[] = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        points.push(trimmed.substring(2).trim());
      }
    }
    
    return points.slice(0, 5);
  };

  const downloadAsPdf = (note: any) => {
    try {
      const doc = generateNotesPdf({
        title: note.title,
        subject: note.subject || note.class,
        noteType: note.noteType || note.class,
        content: note.content,
        keyPoints: note.keyPoints || [],
        timestamp: note.timestamp ? new Date(note.timestamp).toISOString() : new Date().toISOString()
      });
      doc.save(`${note.title || 'notes'}.pdf`);
      toast.success('📥 PDF download हो गया!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('PDF बनाने में error');
    }
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Clean Input Card */}
      <Card className="border border-border shadow-sm">
        <CardContent className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Topper Notes Generator</h2>
              <p className="text-xs text-muted-foreground">संक्षिप्त, exam-ready notes with web search</p>
            </div>
          </div>

          {/* Topic Input */}
          <div>
            <Input
              placeholder="Topic लिखें... जैसे: प्रकाश संश्लेषण, Quadratic Equations"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="text-base h-12"
              onKeyDown={(e) => e.key === 'Enter' && !isGenerating && generateNotes()}
            />
          </div>

          {/* Quick Options Row */}
          <div className="flex flex-wrap gap-2">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[140px] h-9 text-sm">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                {classes.map(cls => (
                  <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-[110px] h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hindi">हिंदी</SelectItem>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex-1" />

            <Button 
              onClick={generateNotes} 
              disabled={isGenerating || !topic.trim()}
              className="h-9 px-4 gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </div>

          {/* Web Search Badge */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Globe className="h-3 w-3" />
            <span>Web search enabled for latest information</span>
          </div>
        </CardContent>
      </Card>

      {/* Saved Notes - Minimal List */}
      {savedNotes.length > 0 && (
        <Card className="border border-border">
          <CardContent className="p-4">
            <h3 className="font-medium text-sm text-foreground mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Recent Notes ({savedNotes.length})
            </h3>
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-2">
                {savedNotes.slice(0, 10).map((note) => (
                  <div 
                    key={note.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">
                        {note.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs h-5">
                          {note.class}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(note.timestamp).toLocaleDateString('hi-IN', { 
                            day: 'numeric', month: 'short'
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8"
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
                          navigate('/notes-ad', { state: { note: noteToView } });
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => downloadAsPdf(note)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => {
                          deleteNote(note.id);
                          toast.success('Note deleted');
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
