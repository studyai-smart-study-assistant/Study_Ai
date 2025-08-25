
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Search,
  BookOpen,
  Plus,
  Edit3,
  Save,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  subject: string;
}

const SimpleContentLibrary: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([
    {
      id: '1',
      title: 'Mathematics - Quadratic Equations',
      content: 'Quadratic equations के basic formulas:\n\nax² + bx + c = 0\n\nDiscriminant: b² - 4ac\n\nRoots: x = (-b ± √D) / 2a',
      tags: ['Math', 'Algebra', 'Class 10'],
      createdAt: '2024-12-28',
      subject: 'Mathematics'
    },
    {
      id: '2',
      title: 'Physics - Laws of Motion',
      content: 'Newton के तीन नियम:\n\n1. पहला नियम (जड़त्व का नियम)\n2. द्वितीय नियम (F = ma)\n3. तृतीय नियम (Action-Reaction)',
      tags: ['Physics', 'Mechanics', 'Class 11'],
      createdAt: '2024-12-27',
      subject: 'Physics'
    }
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    subject: '',
    tags: ''
  });

  const handleCreateNote = () => {
    if (!newNote.title.trim() || !newNote.content.trim()) {
      toast.error('Title और content दोनों जरूरी हैं');
      return;
    }

    const note: Note = {
      id: Date.now().toString(),
      title: newNote.title,
      content: newNote.content,
      subject: newNote.subject || 'General',
      tags: newNote.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      createdAt: new Date().toISOString().split('T')[0]
    };

    setNotes(prev => [note, ...prev]);
    setNewNote({ title: '', content: '', subject: '', tags: '' });
    setIsCreating(false);
    toast.success('✅ Note successfully created!');
  };

  const handleEditNote = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      setNewNote({
        title: note.title,
        content: note.content,
        subject: note.subject,
        tags: note.tags.join(', ')
      });
      setEditingNote(noteId);
      setIsCreating(true);
    }
  };

  const handleUpdateNote = () => {
    if (!editingNote) return;

    setNotes(prev => prev.map(note => 
      note.id === editingNote 
        ? {
            ...note,
            title: newNote.title,
            content: newNote.content,
            subject: newNote.subject || 'General',
            tags: newNote.tags.split(',').map(tag => tag.trim()).filter(Boolean)
          }
        : note
    ));

    setNewNote({ title: '', content: '', subject: '', tags: '' });
    setEditingNote(null);
    setIsCreating(false);
    toast.success('✅ Note updated successfully!');
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
    toast.success('🗑️ Note deleted');
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
    note.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <BookOpen className="h-5 w-5" />
            Simple Content Library
            <Badge className="bg-blue-100 text-blue-800">Text-Based</Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs defaultValue="library" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="library">My Notes</TabsTrigger>
          <TabsTrigger value="create">
            {isCreating ? (editingNote ? 'Edit Note' : 'Create Note') : 'Add New'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search in your notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="outline">{filteredNotes.length} notes</Badge>
          </div>

          <div className="space-y-3">
            {filteredNotes.length === 0 ? (
              <Card className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchQuery ? 'कोई matching notes नहीं मिले' : 'अभी तक कोई notes नहीं हैं। नया note बनाएं।'}
                </p>
              </Card>
            ) : (
              filteredNotes.map((note) => (
                <Card key={note.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <h4 className="font-medium">{note.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {note.subject}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap line-clamp-3">
                          {note.content}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{note.createdAt}</span>
                          <div className="flex gap-1">
                            {note.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditNote(note.id)}
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          {!isCreating ? (
            <Card className="p-8 text-center">
              <Plus className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Create New Note</h3>
              <p className="text-gray-600 mb-4">
                अपने notes, formulas, और important points यहां save करें
              </p>
              <Button 
                onClick={() => setIsCreating(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Start Writing
              </Button>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Note title..."
                    value={newNote.title}
                    onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                  />
                  <Input
                    placeholder="Subject (optional)"
                    value={newNote.subject}
                    onChange={(e) => setNewNote(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>
                
                <Textarea
                  placeholder="Write your notes here..."
                  value={newNote.content}
                  onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                  rows={8}
                />
                
                <Input
                  placeholder="Tags (comma separated)"
                  value={newNote.tags}
                  onChange={(e) => setNewNote(prev => ({ ...prev, tags: e.target.value }))}
                />
                
                <div className="flex gap-2">
                  <Button 
                    onClick={editingNote ? handleUpdateNote : handleCreateNote}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingNote ? 'Update Note' : 'Save Note'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIsCreating(false);
                      setEditingNote(null);
                      setNewNote({ title: '', content: '', subject: '', tags: '' });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SimpleContentLibrary;
