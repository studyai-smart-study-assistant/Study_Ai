
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import StorageStats from './StorageStats';
import ContentList from './ContentList';

interface SavedContent {
  id: string;
  title: string;
  type: 'notes' | 'quiz' | 'plan';
  content: string;
  savedAt: string;
  subject: string;
  size: string;
}

const BrowserStorageManager: React.FC = () => {
  const [savedContent, setSavedContent] = useState<SavedContent[]>([]);
  const [storageUsed, setStorageUsed] = useState(0);

  useEffect(() => {
    loadSavedContent();
    calculateStorageUsage();
  }, []);

  const loadSavedContent = () => {
    try {
      const saved = localStorage.getItem('studyai_saved_content');
      if (saved) {
        setSavedContent(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading saved content:', error);
    }
  };

  const calculateStorageUsage = () => {
    try {
      let total = 0;
      for (let key in localStorage) {
        if (key.startsWith('studyai_')) {
          total += localStorage[key].length;
        }
      }
      setStorageUsed(Math.round(total / 1024));
    } catch (error) {
      console.error('Error calculating storage:', error);
    }
  };

  const removeContent = (id: string) => {
    const updated = savedContent.filter(item => item.id !== id);
    setSavedContent(updated);
    
    try {
      localStorage.setItem('studyai_saved_content', JSON.stringify(updated));
      toast.success('🗑️ Content delete हो गया');
      calculateStorageUsage();
    } catch (error) {
      toast.error('❌ Delete करने में समस्या');
    }
  };

  const viewContent = async (content: SavedContent) => {
    const { safeDownloadText } = await import('@/utils/webviewDownload');
    await safeDownloadText(content.content, `${content.title}.txt`);
    toast.success('📥 Content download हो गया!');
  };

  const exportAllContent = async () => {
    const allContent = savedContent.map(item => ({
      ...item,
      content: item.content
    }));
    
    const { safeDownload } = await import('@/utils/webviewDownload');
    const blob = new Blob([JSON.stringify(allContent, null, 2)], { type: 'application/json' });
    await safeDownload({ blob, filename: `study-ai-backup-${new Date().toISOString().split('T')[0]}.json`, mimeType: 'application/json' });
    toast.success('📦 सारा content export हो गया!');
  };

  const clearAllContent = () => {
    if (window.confirm('क्या आप सच में सारा saved content delete करना चाहते हैं?')) {
      setSavedContent([]);
      localStorage.removeItem('studyai_saved_content');
      calculateStorageUsage();
      toast.success('🧹 सारा content clear हो गया');
    }
  };

  return (
    <div className="space-y-6">
      <StorageStats
        storageUsed={storageUsed}
        itemCount={savedContent.length}
        onExportAll={exportAllContent}
        onClearAll={clearAllContent}
      />
      
      <ContentList
        content={savedContent}
        onView={viewContent}
        onRemove={removeContent}
      />
    </div>
  );
};

export default BrowserStorageManager;
