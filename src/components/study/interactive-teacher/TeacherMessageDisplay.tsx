
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import ReactMarkdown from 'react-markdown';
import MessageContextMenu from '@/components/message/MessageContextMenu';

import { toast } from 'sonner';

interface TeacherMessage {
  id: string;
  content: string;
  isQuestion: boolean;
  awaitingResponse?: boolean;
  timestamp: number;
  liked?: boolean;
  bookmarked?: boolean;
}

interface TeacherMessageDisplayProps {
  messages: TeacherMessage[];
  isProcessing: boolean;
}

const TeacherMessageDisplay: React.FC<TeacherMessageDisplayProps> = ({
  messages,
  isProcessing
}) => {
  const { language } = useLanguage();
  const [messageStates, setMessageStates] = useState<Record<string, { liked: boolean; bookmarked: boolean }>>({});

  const getMessageState = (messageId: string) => {
    return messageStates[messageId] || { liked: false, bookmarked: false };
  };

  const updateMessageState = (messageId: string, updates: Partial<{ liked: boolean; bookmarked: boolean }>) => {
    setMessageStates(prev => ({
      ...prev,
      [messageId]: { ...getMessageState(messageId), ...updates }
    }));
  };

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success(language === 'hi' ? 'कॉपी हो गया' : 'Copied to clipboard');
    } catch (error) {
      toast.error(language === 'hi' ? 'कॉपी नहीं हो सका' : 'Failed to copy');
    }
  };

  const handleLike = (messageId: string) => {
    const currentState = getMessageState(messageId);
    const newLiked = !currentState.liked;
    updateMessageState(messageId, { liked: newLiked });
    
    toast.success(newLiked 
      ? (language === 'hi' ? 'मैसेज को लाइक किया गया' : 'Message liked')
      : (language === 'hi' ? 'लाइक हटाया गया' : 'Like removed')
    );
  };

  const handleBookmark = (messageId: string) => {
    const currentState = getMessageState(messageId);
    const newBookmarked = !currentState.bookmarked;
    updateMessageState(messageId, { bookmarked: newBookmarked });
    
    toast.success(newBookmarked 
      ? (language === 'hi' ? 'मैसेज बुकमार्क किया गया' : 'Message bookmarked')
      : (language === 'hi' ? 'बुकमार्क हटाया गया' : 'Bookmark removed')
    );
  };

  const handleDelete = (messageId: string) => {
    // Since these are live teaching messages, we'll show a warning
    toast.info(language === 'hi' 
      ? 'Live Teaching के दौरान मैसेज डिलीट नहीं कर सकते' 
      : 'Cannot delete messages during Live Teaching session'
    );
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {messages.map((message, index) => {
          const messageState = getMessageState(message.id);
          
          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex justify-start"
            >
              <MessageContextMenu
                isUserMessage={false}
                isLiked={messageState.liked}
                isBookmarked={messageState.bookmarked}
                messageText={message.content}
                onCopy={() => handleCopy(message.content)}
                onDelete={() => handleDelete(message.id)}
                onLike={() => handleLike(message.id)}
                onBookmark={() => handleBookmark(message.id)}
                >
                  <Card className={`bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 max-w-4xl w-full hover:shadow-xl transition-all duration-200 ${
                    messageState.bookmarked ? 'ring-2 ring-amber-400' : ''
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex-shrink-0 shadow-lg">
                          <GraduationCap className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-4">
                            <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                              {language === 'hi' ? 'शिक्षक' : 'Teacher'}
                            </span>
                            {message.isQuestion && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700">
                                <HelpCircle className="h-3 w-3 mr-1" />
                                {language === 'hi' ? 'प्रश्न' : 'Question'}
                              </Badge>
                            )}
                            {messageState.liked && (
                              <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                                ❤️ {language === 'hi' ? 'पसंद' : 'Liked'}
                              </Badge>
                            )}
                            {messageState.bookmarked && (
                              <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                                🔖 {language === 'hi' ? 'सेव' : 'Saved'}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="prose prose-lg dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 leading-relaxed">
                            <ReactMarkdown
                              components={{
                                p: ({ children }) => <p className="mb-4 text-base leading-relaxed">{children}</p>,
                                h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">{children}</h2>,
                                h3: ({ children }) => <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">{children}</h3>,
                                strong: ({ children }) => <strong className="font-bold text-gray-900 dark:text-gray-100">{children}</strong>,
                                em: ({ children }) => <em className="italic text-blue-700 dark:text-blue-300">{children}</em>,
                                ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
                                li: ({ children }) => <li className="text-base leading-relaxed">{children}</li>,
                                blockquote: ({ children }) => (
                                  <blockquote className="border-l-4 border-blue-500 pl-4 italic bg-blue-50 dark:bg-blue-900/20 p-4 rounded-r-lg mb-4">
                                    {children}
                                  </blockquote>
                                ),
                                code: ({ children }) => (
                                  <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono">
                                    {children}
                                  </code>
                                )
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    </Card>
              </MessageContextMenu>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {isProcessing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-start"
        >
          <Card className="bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 max-w-4xl w-full">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex-shrink-0">
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    {language === 'hi' ? 'शिक्षक आपके जवाब को समझ रहे हैं...' : 'Teacher is understanding your answer...'}
                  </span>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.2}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default TeacherMessageDisplay;
