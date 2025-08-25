
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useInteractiveTeacherHistory } from '@/hooks/interactive-teacher/useInteractiveTeacherHistory';
import { useLanguage } from '@/contexts/LanguageContext';
import { History, Trash2, BookOpen, User, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface InteractiveTeacherHistoryProps {
  onSelectChat?: (chatId: string) => void;
}

const InteractiveTeacherHistory: React.FC<InteractiveTeacherHistoryProps> = ({ onSelectChat }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { chats, deleteChat, loadHistory } = useInteractiveTeacherHistory();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteChat(chatId);
      toast.success(language === 'hi' ? 'चैट डिलीट हो गया' : 'Chat deleted successfully');
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error(language === 'hi' ? 'चैट डिलीट करने में त्रुटि' : 'Failed to delete chat');
    }
  };

  const handleSelectChat = (chat: any) => {
    // Create new session and navigate
    const sessionId = `session_${Date.now()}`;
    sessionStorage.setItem(`lesson_${sessionId}`, JSON.stringify({
      prompt: '',
      context: chat.context,
      messages: chat.messages
    }));
    
    navigate(`/interactive-teacher/${sessionId}`);
    setIsOpen(false);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('hi-IN');
  };

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-purple-600 hover:text-purple-700 hover:bg-purple-100 dark:text-purple-400 dark:hover:bg-purple-900/40"
        onClick={() => setIsOpen(true)}
        title={language === 'hi' ? 'इंटरैक्टिव चैट हिस्ट्री' : 'Interactive Chat History'}
      >
        <History className="h-5 w-5" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === 'hi' ? 'इंटरैक्टिव टीचर हिस्ट्री' : 'Interactive Teacher History'}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh]">
            {chats.length === 0 ? (
              <p className="text-center py-6 text-gray-500">
                {language === 'hi' ? 'कोई हिस्ट्री नहीं मिली' : 'No history found'}
              </p>
            ) : (
              <ul className="space-y-3">
                {chats.map((chat) => (
                  <li 
                    key={chat.id} 
                    onClick={() => handleSelectChat(chat)}
                    className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-purple-300 dark:hover:border-purple-600"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 overflow-hidden flex-1">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex-shrink-0">
                          <BookOpen className="h-4 w-4 text-white" />
                        </div>
                        <div className="overflow-hidden flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {chat.subject}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {chat.chapter}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            {chat.studentName && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3 text-blue-500" />
                                <span className="text-xs text-blue-600 dark:text-blue-400">
                                  {chat.studentName}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-gray-500" />
                              <span className="text-xs text-gray-500">
                                {formatDate(chat.timestamp)}
                              </span>
                            </div>
                          </div>
                          <Badge variant="outline" className="mt-2 text-xs">
                            {chat.messages.length} {language === 'hi' ? 'संदेश' : 'messages'}
                          </Badge>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0"
                        onClick={(e) => handleDeleteChat(chat.id, e)}
                        title={language === 'hi' ? 'चैट डिलीट करें' : 'Delete chat'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InteractiveTeacherHistory;
