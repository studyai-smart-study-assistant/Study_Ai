
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { uploadBook } from '@/lib/firebase/library';
import { BookCategory, BookUploadForm } from '@/types/library';

interface UploadBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const initialFormState: BookUploadForm = {
  title: '',
  author: '',
  description: '',
  category: 'अन्य',
  tags: [],
  isPublic: true
};

const UploadBookModal: React.FC<UploadBookModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [form, setForm] = useState<BookUploadForm>(initialFormState);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [fileSelected, setFileSelected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTag, setCurrentTag] = useState('');

  const categories: BookCategory[] = [
    "पाठ्यपुस्तकें",
    "रेफरेंस",
    "प्रैक्टिस सेट",
    "नोट्स",
    "अन्य"
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (value: string) => {
    setForm(prev => ({ ...prev, category: value as BookCategory }));
  };

  const handlePublicToggle = (checked: boolean) => {
    setForm(prev => ({ ...prev, isPublic: checked }));
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // फाइल वैलिडेशन
    if (!file.type.startsWith('image/')) {
      toast.error('कृपया केवल छवि फाइल अपलोड करें');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('छवि 5MB से कम होनी चाहिए');
      return;
    }
    
    setForm(prev => ({ ...prev, coverImage: file }));
    
    // फाइल प्रीव्यू बनाएं
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // फाइल वैलिडेशन
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      toast.error('कृपया केवल PDF या Word दस्तावेज़ अपलोड करें');
      return;
    }
    
    if (file.size > 50 * 1024 * 1024) {
      toast.error('फाइल 50MB से कम होनी चाहिए');
      return;
    }
    
    setForm(prev => ({ ...prev, bookFile: file }));
    setFileSelected(true);
  };

  const handleAddTag = () => {
    if (!currentTag.trim()) return;
    if (form.tags.includes(currentTag.trim())) {
      toast.error('यह टैग पहले से ही जोड़ा गया है');
      return;
    }
    
    if (form.tags.length >= 5) {
      toast.error('अधिकतम 5 टैग जोड़े जा सकते हैं');
      return;
    }
    
    setForm(prev => ({ ...prev, tags: [...prev.tags, currentTag.trim()] }));
    setCurrentTag('');
  };

  const handleRemoveTag = (tag: string) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // बेसिक वैलिडेशन
    if (!form.title.trim()) {
      toast.error('पुस्तक का शीर्षक आवश्यक है');
      return;
    }
    
    if (!form.author.trim()) {
      toast.error('लेखक का नाम आवश्यक है');
      return;
    }
    
    // फाइल या लिंक की जरूरत है
    if (!form.bookFile && !form.externalLink) {
      toast.error('कृपया पुस्तक फाइल अपलोड करें या बाहरी लिंक प्रदान करें');
      return;
    }
    
    try {
      setIsLoading(true);
      await uploadBook(form);
      toast.success('पुस्तक सफलतापूर्वक अपलोड की गई');
      onSuccess();
      onClose();
      setForm(initialFormState);
      setCoverPreview('');
      setFileSelected(false);
    } catch (error) {
      console.error('अपलोड त्रुटि:', error);
      toast.error('पुस्तक अपलोड करने में समस्या हुई');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">नई पुस्तक अपलोड करें</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="title">पुस्तक का शीर्षक *</Label>
              <Input 
                id="title" 
                name="title" 
                value={form.title} 
                onChange={handleChange} 
                placeholder="पुस्तक का शीर्षक" 
                required 
              />
            </div>
            
            <div>
              <Label htmlFor="author">लेखक *</Label>
              <Input 
                id="author" 
                name="author" 
                value={form.author} 
                onChange={handleChange} 
                placeholder="लेखक का नाम" 
                required 
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">विवरण</Label>
            <Textarea 
              id="description" 
              name="description" 
              value={form.description} 
              onChange={handleChange} 
              placeholder="पुस्तक का संक्षिप्त विवरण" 
            />
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="category">श्रेणी</Label>
              <Select 
                value={form.category} 
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="श्रेणी चुनें" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="externalLink">बाहरी लिंक (वैकल्पिक)</Label>
              <Input 
                id="externalLink" 
                name="externalLink" 
                value={form.externalLink || ''} 
                onChange={handleChange} 
                placeholder="https://example.com/book" 
              />
            </div>
          </div>
          
          <div>
            <Label>टैग्स</Label>
            <div className="flex gap-2 mb-2">
              <Input 
                value={currentTag} 
                onChange={(e) => setCurrentTag(e.target.value)} 
                placeholder="टैग जोड़ें और एंटर दबाएं"
                onKeyDown={handleKeyDown}
              />
              <Button type="button" onClick={handleAddTag}>जोड़ें</Button>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {form.tags.map(tag => (
                <div 
                  key={tag} 
                  className="bg-purple-100 dark:bg-purple-900 px-3 py-1 rounded-full flex items-center gap-1 text-sm"
                >
                  {tag}
                  <button 
                    type="button" 
                    onClick={() => handleRemoveTag(tag)}
                    className="text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="coverImage">कवर इमेज (वैकल्पिक)</Label>
              <div className="mt-2">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 text-center">
                  {coverPreview ? (
                    <div className="relative">
                      <img 
                        src={coverPreview} 
                        alt="Cover preview" 
                        className="mx-auto h-40 object-contain rounded" 
                      />
                      <button 
                        type="button"
                        className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full"
                        onClick={() => {
                          setCoverPreview('');
                          setForm(prev => ({ ...prev, coverImage: undefined }));
                        }}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-gray-400" />
                        <span className="text-sm text-gray-500">कवर इमेज अपलोड करें</span>
                      </div>
                      <input 
                        type="file" 
                        id="coverImage" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleCoverImageChange} 
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">अधिकतम 5MB, JPG, PNG, या GIF</p>
              </div>
            </div>
            
            <div>
              <Label htmlFor="bookFile">पुस्तक फाइल</Label>
              <div className="mt-2">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 text-center h-40 flex items-center justify-center">
                  {fileSelected ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-green-500 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        फाइल चयनित
                      </div>
                      <button 
                        type="button"
                        className="text-xs text-red-500"
                        onClick={() => {
                          setFileSelected(false);
                          setForm(prev => ({ ...prev, bookFile: undefined }));
                        }}
                      >
                        रद्द करें
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block w-full h-full flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-gray-400" />
                        <span className="text-sm text-gray-500">पुस्तक फाइल अपलोड करें</span>
                      </div>
                      <input 
                        type="file" 
                        id="bookFile" 
                        accept=".pdf,.doc,.docx" 
                        className="hidden" 
                        onChange={handleFileChange} 
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">अधिकतम 50MB, PDF या DOC फाइल</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="isPublic" 
              checked={form.isPublic}
              onCheckedChange={handlePublicToggle}
            />
            <Label htmlFor="isPublic">सार्वजनिक रूप से प्रकाशित करें</Label>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              रद्द करें
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'अपलोड हो रहा है...' : 'अपलोड करें'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadBookModal;
