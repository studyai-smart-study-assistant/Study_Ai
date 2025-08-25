import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { chatDB } from '@/lib/db';
import { Message } from '@/lib/chat/types';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ArrowLeft, BookmarkCheck, Search, MessageSquare, Trash } from 'lucide-react';
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useIsMobile } from '@/hooks/use-mobile';

const SavedMessages = () => {
  const { currentUser, isLoading } = useAuth();
  const [savedMessages, setSavedMessages] = useState<Message[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState("bookmarks");
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    loadSavedMessages();
  }, [activeTab]);

  const loadSavedMessages = async () => {
    try {
      // Fetch all chats
      const chats = await chatDB.getAllChats();
      
      // Extract all messages from chats
      let allMessages: Message[] = [];
      chats.forEach(chat => {
        chat.messages.forEach(message => {
          if (activeTab === "bookmarks" && message.bookmarked) {
            allMessages.push(message);
          } else if (activeTab === "all") {
            allMessages.push(message);
          }
        });
      });
      
      // Sort by timestamp (newest first)
      allMessages.sort((a, b) => b.timestamp - a.timestamp);
      
      setSavedMessages(allMessages);
    } catch (error) {
      console.error('Error loading saved messages:', error);
      toast.error('Failed to load saved messages');
    }
  };

  const handleRemoveBookmark = async (message: Message) => {
    try {
      await chatDB.toggleMessageBookmark(message.chatId, message.id);
      toast.success('Bookmark removed');
      loadSavedMessages();
    } catch (error) {
      console.error('Error removing bookmark:', error);
      toast.error('Failed to remove bookmark');
    }
  };

  const handleGoToChat = (chatId: string) => {
    navigate('/', { state: { activeChatId: chatId } });
  };

  const filteredMessages = savedMessages.filter(message =>
    message.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50 dark:from-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Saved Messages</h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center mb-6">
              <Tabs 
                defaultValue="bookmarks" 
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="w-full mb-4 sm:w-auto">
                  <TabsTrigger value="bookmarks" className="flex-1">
                    <BookmarkCheck className="mr-2 h-4 w-4" />
                    Bookmarks
                  </TabsTrigger>
                  <TabsTrigger value="all" className="flex-1">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    All Messages
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  className="pl-10"
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {filteredMessages.length === 0 ? (
              <div className="text-center py-12">
                <BookmarkCheck className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">
                  {activeTab === "bookmarks" 
                    ? "No bookmarked messages yet" 
                    : "No messages found"}
                </h3>
                <p className="text-gray-400 dark:text-gray-500 mt-2">
                  {activeTab === "bookmarks" 
                    ? "Bookmark messages in your chats to see them here" 
                    : searchTerm ? "Try a different search term" : "Your message history will appear here"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredMessages.map((message) => (
                  <div 
                    key={message.id} 
                    className={cn(
                      "p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors",
                      message.role === "bot" ? "bg-purple-50/30 dark:bg-gray-800/50" : ""
                    )}
                  >
                    <div className="flex justify-between">
                      <div className="flex items-center mb-2">
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center mr-2",
                          message.role === "bot" 
                            ? "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300" 
                            : "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
                        )}>
                          {message.role === "bot" ? "AI" : "U"}
                        </div>
                        <span className="text-sm font-medium">
                          {message.role === "bot" ? "AI Assistant" : "You"}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                          {new Date(message.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {message.bookmarked && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveBookmark(message)}
                            className="h-7 w-7 rounded-full p-0"
                          >
                            <Trash className="h-4 w-4 text-red-400 hover:text-red-500" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleGoToChat(message.chatId)}
                          className="h-7 px-2 text-xs"
                        >
                          View Chat
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words text-sm">
                      {message.content.length > 300 
                        ? `${message.content.substring(0, 300)}...` 
                        : message.content
                      }
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavedMessages;
