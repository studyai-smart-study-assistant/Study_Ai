
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { chatDB } from '@/lib/db';
import { Chat, Message } from '@/lib/db';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, MessageSquare, Calendar, Trash2, Edit3, Check, X } from 'lucide-react';
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const ChatHistory = () => {
  const { currentUser, isLoading } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !currentUser) {
      navigate('/login');
    } else if (currentUser) {
      loadChats();
    }
  }, [currentUser, isLoading, navigate]);

  const loadChats = async () => {
    try {
      setIsDataLoading(true);
      const allChats = await chatDB.getAllChats();
      
      // Sort by timestamp (newest first)
      allChats.sort((a, b) => b.timestamp - a.timestamp);
      
      setChats(allChats);
    } catch (error) {
      console.error('Error loading chats:', error);
      toast.error('Failed to load chat history');
    } finally {
      setIsDataLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteChat = async (chatId: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    try {
      await chatDB.deleteChat(chatId);
      toast.success('Chat deleted successfully');
      
      // Refresh the list
      setChats(chats.filter(chat => chat.id !== chatId));
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error('Failed to delete chat');
    }
  };

  const handleRenameChat = async (chatId: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setEditingChatId(chatId);
      setEditingTitle(chat.title);
    }
  };

  const saveRename = async () => {
    if (!editingChatId || !editingTitle.trim()) {
      toast.error('Title cannot be empty');
      return;
    }

    try {
      await chatDB.updateChatTitle(editingChatId, editingTitle.trim());
      
      // Update local state
      setChats(currentChats => currentChats.map(chat => 
        chat.id === editingChatId 
          ? { ...chat, title: editingTitle.trim() } 
          : chat
      ));
      
      setEditingChatId(null);
      setEditingTitle('');
      toast.success('Chat renamed successfully');
    } catch (error) {
      console.error('Error renaming chat:', error);
      toast.error('Failed to rename chat');
    }
  };

  const cancelRename = () => {
    setEditingChatId(null);
    setEditingTitle('');
  };

  const handleChatClick = (chatId: string) => {
    if (editingChatId) return; // Don't navigate while editing
    navigate('/', { state: { activeChatId: chatId } });
  };

  const filteredChats = chats.filter(chat => 
    chat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.messages.some(msg => 
      msg.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-purple-950">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-purple-950 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="mr-3 hover:bg-purple-100 dark:hover:bg-purple-900/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Chat History
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage and browse your conversation history
            </p>
          </div>
        </div>

        {/* Search and Stats Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-100 dark:border-purple-800 overflow-hidden mb-6">
          <div className="p-6">
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                className="pl-12 py-3 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Search in your chats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-4 text-white">
                <div className="text-2xl font-bold">{chats.length}</div>
                <div className="text-purple-100 text-sm">Total Chats</div>
              </div>
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-4 text-white">
                <div className="text-2xl font-bold">
                  {chats.reduce((total, chat) => total + chat.messages.length, 0)}
                </div>
                <div className="text-emerald-100 text-sm">Total Messages</div>
              </div>
            </div>

            {/* Chat List */}
            {isDataLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                  {searchTerm ? "No chats found" : "No chat history"}
                </h3>
                <p className="text-gray-400 dark:text-gray-500">
                  {searchTerm ? "Try a different search term" : "Start a new chat to see your history"}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-400px)]">
                <div className="space-y-3">
                  {filteredChats.map((chat) => (
                    <div 
                      key={chat.id}
                      onClick={() => handleChatClick(chat.id)}
                      className={cn(
                        "group cursor-pointer rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-200 overflow-hidden",
                        editingChatId === chat.id ? "bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-600" : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      )}
                    >
                      <div className="p-4">
                        {editingChatId === chat.id ? (
                          // Editing Mode
                          <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                            <Input
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              placeholder="Enter chat title"
                              className="text-lg font-medium"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveRename();
                                if (e.key === 'Escape') cancelRename();
                              }}
                            />
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                onClick={saveRename}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Save
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={cancelRename}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // Normal Mode
                          <>
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center flex-1 min-w-0">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center mr-3 flex-shrink-0">
                                  <MessageSquare className="h-5 w-5 text-white" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-semibold text-gray-900 dark:text-white truncate text-lg">
                                    {chat.title}
                                  </h3>
                                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    <span>{formatDate(chat.timestamp)}</span>
                                    <span className="mx-2">•</span>
                                    <span>{formatTime(chat.timestamp)}</span>
                                    <span className="mx-2">•</span>
                                    <span>{chat.messages.length} messages</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                                  onClick={(e) => handleRenameChat(chat.id, e)}
                                  title="Rename chat"
                                >
                                  <Edit3 className="h-4 w-4 text-blue-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30"
                                  onClick={(e) => handleDeleteChat(chat.id, e)}
                                  title="Delete chat"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </div>
                            
                            {/* Last Message Preview */}
                            {chat.messages.length > 0 && (
                              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                                <span className="font-medium text-purple-600 dark:text-purple-400">Last message: </span>
                                {chat.messages[chat.messages.length - 1].content}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatHistory;
