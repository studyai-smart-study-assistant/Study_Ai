
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { uploadBook } from '@/lib/supabase/library-functions';
import { BookCategory, BookUploadForm } from '@/types/library';

interface UploadBookModalProps { isOpen: boolean; onClose: () => void; onSuccess: () => void; }

const initialFormState: BookUploadForm = { title: '', author: '', description: '', category: 'अन्य', tags: [], isPublic: true };
const categories: BookCategory[] = ["पाठ्यपुस्तकें", "रेफरेंस", "प्रैक्टिस सेट", "नोट्स", "अन्य"];

const UploadBookModal: React.FC<UploadBookModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [form, setForm] = useState<BookUploadForm>(initialFormState);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.author.trim()) return toast.error('शीर्षक और लेखक आवश्यक है');
    setIsLoading(true);
    try { await uploadBook(form); toast.success('पुस्तक अपलोड हो गई'); onSuccess(); onClose(); setForm(initialFormState); }
    catch { toast.error('अपलोड में समस्या'); }
    finally { setIsLoading(false); }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader><DialogTitle>नई पुस्तक अपलोड करें</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div><Label>शीर्षक *</Label><Input name="title" value={form.title} onChange={(e) => setForm(p => ({...p, title: e.target.value}))} required /></div>
            <div><Label>लेखक *</Label><Input name="author" value={form.author} onChange={(e) => setForm(p => ({...p, author: e.target.value}))} required /></div>
          </div>
          <div><Label>विवरण</Label><Textarea name="description" value={form.description} onChange={(e) => setForm(p => ({...p, description: e.target.value}))} /></div>
          <div><Label>श्रेणी</Label><Select value={form.category} onValueChange={(v) => setForm(p => ({...p, category: v as BookCategory}))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
          <DialogFooter><Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>रद्द</Button><Button type="submit" disabled={isLoading}>{isLoading ? 'अपलोड हो रहा है...' : 'अपलोड'}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadBookModal;
