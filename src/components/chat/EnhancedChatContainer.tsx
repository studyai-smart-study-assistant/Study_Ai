
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useEnhancedChat } from '@/hooks/chat/useEnhancedChat';
import ChatBody from './ChatBody';
import ChatFooter from '../ChatFooter';
import AlertHandler from './AlertHandler';
import { useMessageHandler } from '@/hooks/chat/useMessageHandler';
import { useScrollHandler } from '@/hooks/chat/useScrollHandler';
import WebSearchSources from '../message/WebSearchSources';
import ImageEditDialog from '../message/ImageEditDialog';
import { supabase } from '@/integrations/supabase/client';
import { chatDB } from '@/lib/db';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface EnhancedChatContainerProps {
  chatId: string;
  onChatUpdated?: () => void;
}

const EnhancedChatContainer: React.FC<EnhancedChatContainerProps> = ({ 
  chatId, 
  onChatUpdated 
}) => {
  const { 
    messages, 
    isLoading, 
    isResponding, 
    showLimitAlert, 
    setShowLimitAlert, 
    loadMessages,
    sendMessage,
    messageLimitReached,
    enhancedSendMessage,
    getChatStats,
    webSearchEnabled,
    setWebSearchEnabled,
    lastSources
  } = useEnhancedChat(chatId, onChatUpdated);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { scrollToBottom } = useScrollHandler(messagesEndRef);
  const { language } = useLanguage();

  const { 
    handleSend, 
    handleMessageEdited, 
    handleMessageDeleted 
  } = useMessageHandler({
    chatId,
    loadMessages,
    onChatUpdated,
    scrollToBottom,
    sendMessage: enhancedSendMessage
  });

  const [editImageState, setEditImageState] = useState<{ imageUrl: string; prompt: string } | null>(null);
  const [deepThinkingSources, setDeepThinkingSources] = useState<{ title: string; url: string }[]>([]);

  const handleEditImage = useCallback((imageUrl: string, originalPrompt: string) => {
    setEditImageState({ imageUrl, prompt: originalPrompt });
  }, []);

  const handleEditImageSubmit = useCallback((newPrompt: string, imageUrl: string) => {
    enhancedSendMessage(newPrompt, imageUrl);
    setEditImageState(null);
  }, [enhancedSendMessage]);

  // ── News Search handler ──
  const handleNewsSearch = useCallback(async (query: string) => {
    toast.info(language === 'hi'
      ? `📰 "${query}" की ताज़ा खबरें खोज रहे हैं...`
      : `📰 Fetching news for "${query}"...`,
      { duration: 5000 }
    );

    await chatDB.addMessage(chatId, `📰 News: ${query}`, 'user');
    if (onChatUpdated) onChatUpdated();
    await loadMessages();
    scrollToBottom();

    try {
      // First try with original query
      let { data, error } = await supabase.functions.invoke('fetch-news', {
        body: { query },
      });

      if (error) throw error;
      
      // If no articles with query, retry without query (general news)
      if (!data?.success || !data.articles?.length) {
        const fallback = await supabase.functions.invoke('fetch-news', {
          body: { category: 'education' },
        });
        if (fallback.data?.success && fallback.data?.articles?.length) {
          data = fallback.data;
        } else {
          throw new Error('No news found');
        }
      }

      // Build formatted news response
      const articles = data.articles.slice(0, 8);
      let newsContent = `📰 **"${query}" — ताज़ा खबरें**\n\n`;
      articles.forEach((a: any, i: number) => {
        newsContent += `**${i + 1}. ${a.title}**\n`;
        if (a.description) newsContent += `${a.description.slice(0, 150)}...\n`;
        newsContent += `🔗 [${a.source}](${a.url}) • ${a.pubDate ? new Date(a.pubDate).toLocaleDateString('hi-IN') : 'आज'}\n\n`;
      });

      // Save sources for display
      const newsSources = articles.map((a: any) => ({ title: a.title, url: a.url }));
      setDeepThinkingSources(newsSources);

      await chatDB.addMessage(chatId, newsContent, 'bot');
      await loadMessages();
      scrollToBottom();
      if (onChatUpdated) onChatUpdated();

      toast.success(language === 'hi'
        ? `✅ ${articles.length} खबरें मिलीं`
        : `✅ ${articles.length} news articles found`
      );
    } catch (err: any) {
      console.error('News fetch error:', err);
      toast.error(language === 'hi' ? 'खबरें लाने में समस्या हुई' : 'Failed to fetch news');
      enhancedSendMessage(`📰 [NEWS] ${query} — इस विषय की आज की ताज़ा खबरें बताओ।`);
    }
  }, [chatId, onChatUpdated, loadMessages, scrollToBottom, enhancedSendMessage, language]);

  // ── Deep Thinking: calls edge function with Tavily multi-search ──
  const handleDeepThinking = useCallback(async (topic: string) => {
    toast.info(language === 'hi'
      ? `🔭 "${topic}" पर गहन रिसर्च हो रही है... कृपया प्रतीक्षा करें (30-60 sec)`
      : `🔭 Deep research on "${topic}"... please wait (30-60 sec)`,
      { duration: 8000 }
    );

    await chatDB.addMessage(chatId, `🔭 Deep Thinking: ${topic}`, 'user');
    if (onChatUpdated) onChatUpdated();
    await loadMessages();
    scrollToBottom();

    try {
      const { data, error } = await supabase.functions.invoke('deep-thinking', {
        body: { topic },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Deep thinking failed');

      if (data.sources?.length > 0) setDeepThinkingSources(data.sources);

      const botContent = `🔭 **Deep Research: ${topic}**\n\n*${data.searchCount || 0} web sources से रिसर्च की गई*\n\n---\n\n${data.response}`;
      await chatDB.addMessage(chatId, botContent, 'bot');
      await loadMessages();
      scrollToBottom();
      if (onChatUpdated) onChatUpdated();

      toast.success(language === 'hi'
        ? `✅ Deep Thinking पूरी हुई — ${data.sources?.length || 0} sources मिले`
        : `✅ Deep research done — ${data.sources?.length || 0} sources found`
      );
    } catch (err: any) {
      console.error('Deep Thinking error:', err);
      toast.error(language === 'hi' ? 'गहन रिसर्च में समस्या हुई' : 'Deep research failed');
      enhancedSendMessage(`🔬 [DEEP RESEARCH] ${topic} — इस विषय पर गहन जानकारी दो: इतिहास, वर्तमान स्थिति, भविष्य, expert opinions।`);
    }
  }, [chatId, onChatUpdated, loadMessages, scrollToBottom, enhancedSendMessage, language]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background to-muted/30 w-full overflow-hidden relative">
      <AlertHandler 
        showLimitAlert={showLimitAlert} 
        onClose={() => setShowLimitAlert(false)} 
      />
      
      <ChatBody
        messages={messages}
        isLoading={isLoading}
        isResponding={isResponding}
        onMessageEdited={handleMessageEdited}
        onMessageDeleted={handleMessageDeleted}
        onSendMessage={handleSend}
        messagesEndRef={messagesEndRef}
        onEditImage={handleEditImage}
      />

      {/* Show sources after the last bot message when web search was used */}
      {lastSources.length > 0 && !isResponding && (
        <div className="px-4 sm:px-8 max-w-[760px] mx-auto w-full">
          <WebSearchSources sources={lastSources} />
        </div>
      )}

      {/* Deep Thinking sources */}
      {deepThinkingSources.length > 0 && !isResponding && (
        <div className="px-4 sm:px-8 max-w-[760px] mx-auto w-full">
          <WebSearchSources sources={deepThinkingSources} />
        </div>
      )}
      
      <ChatFooter 
        onSend={(msg: string) => handleSend(msg)} 
        isLoading={isLoading} 
        isDisabled={isResponding || messageLimitReached}
        webSearchEnabled={webSearchEnabled}
        onWebSearchToggle={setWebSearchEnabled}
        onDeepThinking={handleDeepThinking}
        onNewsSearch={handleNewsSearch}
      />

      {/* Image Edit Dialog */}
      {editImageState && (
        <ImageEditDialog
          isOpen={!!editImageState}
          imageUrl={editImageState.imageUrl}
          originalPrompt={editImageState.prompt}
          onClose={() => setEditImageState(null)}
          onSubmit={handleEditImageSubmit}
        />
      )}
    </div>
  );
};

export default EnhancedChatContainer;
