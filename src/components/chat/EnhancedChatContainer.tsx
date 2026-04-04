
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
import { UploadedFile } from '../ChatFooterActions';

interface EnhancedChatContainerProps {
  chatId: string;
  onChatUpdated?: () => void;
}

interface NewsArticle {
  title: string;
  description?: string;
  source?: string;
  url: string;
  pubDate?: string;
}

interface NewsResponse {
  success?: boolean;
  articles?: NewsArticle[];
}

interface DeepThinkingResponse {
  success?: boolean;
  error?: string;
  response?: string;
  searchCount?: number;
  sources?: Array<{ title: string; url: string }>;
}

const EnhancedChatContainer: React.FC<EnhancedChatContainerProps> = ({ chatId, onChatUpdated }) => {
  const { 
    messages, isLoading, isResponding, showLimitAlert, setShowLimitAlert,
    loadMessages, messageLimitReached, enhancedSendMessage,
    webSearchEnabled, setWebSearchEnabled, lastSources,
    agentStatus, streamingContent, prefetchContext,
  } = useEnhancedChat(chatId, onChatUpdated);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { scrollToBottom } = useScrollHandler(messagesEndRef);
  const { language } = useLanguage();

  const { handleSend, handleMessageEdited, handleMessageDeleted } = useMessageHandler({
    chatId, loadMessages, onChatUpdated, scrollToBottom,
    sendMessage: enhancedSendMessage,
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

  // Pre-fetch context when user starts typing
  const handleInputFocus = useCallback(() => {
    prefetchContext();
  }, [prefetchContext]);

  // News Search handler
  const handleNewsSearch = useCallback(async (query: string) => {
    toast.info(language === 'hi' ? `📰 "${query}" की ताज़ा खबरें खोज रहे हैं...` : `📰 Fetching news for "${query}"...`, { duration: 5000 });
    await chatDB.addMessage(chatId, `📰 News: ${query}`, 'user');
    if (onChatUpdated) onChatUpdated();
    await loadMessages();
    scrollToBottom();

    try {
      const { data, error } = await supabase.functions.invoke<NewsResponse>('fetch-news', { body: { query } });
      if (error) throw error;
      let resolvedData = data;
      if (!resolvedData?.success || !resolvedData.articles?.length) {
        const fallback = await supabase.functions.invoke('fetch-news', { body: { category: 'education' } });
        if (fallback.data?.success && fallback.data?.articles?.length) resolvedData = fallback.data as NewsResponse;
        else throw new Error('No news found');
      }

      const articles = (resolvedData.articles || []).slice(0, 8);
      let newsContent = `📰 **"${query}" — ताज़ा खबरें**\n\n`;
      articles.forEach((a, i: number) => {
        newsContent += `**${i + 1}. ${a.title}**\n`;
        if (a.description) newsContent += `${a.description.slice(0, 150)}...\n`;
        newsContent += `🔗 [${a.source}](${a.url}) • ${a.pubDate ? new Date(a.pubDate).toLocaleDateString('hi-IN') : 'आज'}\n\n`;
      });

      setDeepThinkingSources(articles.map((a) => ({ title: a.title, url: a.url })));
      await chatDB.addMessage(chatId, newsContent, 'bot');
      await loadMessages();
      scrollToBottom();
      if (onChatUpdated) onChatUpdated();
      toast.success(language === 'hi' ? `✅ ${articles.length} खबरें मिलीं` : `✅ ${articles.length} news articles found`);
    } catch (err: unknown) {
      console.error('News fetch error:', err);
      toast.error(language === 'hi' ? 'खबरें लाने में समस्या हुई' : 'Failed to fetch news');
      enhancedSendMessage(`📰 [NEWS] ${query} — इस विषय की आज की ताज़ा खबरें बताओ।`);
    }
  }, [chatId, onChatUpdated, loadMessages, scrollToBottom, enhancedSendMessage, language]);

  // Deep Thinking handler
  const handleDeepThinking = useCallback(async (topic: string) => {
    toast.info(language === 'hi' ? `🔭 "${topic}" पर गहन रिसर्च...` : `🔭 Deep research on "${topic}"...`, { duration: 8000 });
    await chatDB.addMessage(chatId, `🔭 Deep Thinking: ${topic}`, 'user');
    if (onChatUpdated) onChatUpdated();
    await loadMessages();
    scrollToBottom();

    try {
      const { data: authData } = await supabase.auth.getUser();
      const { data, error } = await supabase.functions.invoke<DeepThinkingResponse>('deep-thinking', {
        body: {
          topic,
          user_id: authData.user?.id,
          notify_on_complete: document.hidden,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Deep thinking failed');
      if (data.sources?.length > 0) setDeepThinkingSources(data.sources);

      const botContent = `🔭 **Deep Research: ${topic}**\n\n*${data.searchCount || 0} web sources*\n\n---\n\n${data.response}`;
      await chatDB.addMessage(chatId, botContent, 'bot');
      await loadMessages();
      scrollToBottom();
      if (onChatUpdated) onChatUpdated();
      toast.success(language === 'hi' ? `✅ Deep Thinking पूरी — ${data.sources?.length || 0} sources` : `✅ Done — ${data.sources?.length || 0} sources`);
    } catch (err: unknown) {
      console.error('Deep Thinking error:', err);
      toast.error(language === 'hi' ? 'गहन रिसर्च में समस्या हुई' : 'Deep research failed');
      enhancedSendMessage(`🔬 [DEEP RESEARCH] ${topic} — इस विषय पर गहन जानकारी दो।`);
    }
  }, [chatId, onChatUpdated, loadMessages, scrollToBottom, enhancedSendMessage, language]);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom, streamingContent]);

  const fileToDataUrl = useCallback((file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }, []);

  const getPriorityAttachment = useCallback((files?: UploadedFile[]) => {
    if (!files?.length) return undefined;
    return files.find(file => file.type === 'image' || file.type === 'pdf') || files[0];
  }, []);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background to-muted/30 w-full overflow-hidden relative">
      <AlertHandler showLimitAlert={showLimitAlert} onClose={() => setShowLimitAlert(false)} />
      
      <ChatBody
        messages={messages}
        isLoading={isLoading}
        isResponding={isResponding}
        onMessageEdited={handleMessageEdited}
        onMessageDeleted={handleMessageDeleted}
        onSendMessage={handleSend}
        messagesEndRef={messagesEndRef}
        onEditImage={handleEditImage}
        agentStatus={agentStatus}
      />

      {lastSources.length > 0 && !isResponding && (
        <div className="px-4 sm:px-8 max-w-[760px] mx-auto w-full">
          <WebSearchSources sources={lastSources} />
        </div>
      )}

      {deepThinkingSources.length > 0 && !isResponding && (
        <div className="px-4 sm:px-8 max-w-[760px] mx-auto w-full">
          <WebSearchSources sources={deepThinkingSources} />
        </div>
      )}
      
      <ChatFooter 
        onSend={async (msg: string, files?: UploadedFile[], options?: { reasoningMode?: boolean }) => {
          let imageBase64: string | undefined;
          const priorityFile = getPriorityAttachment(files);

          if (priorityFile?.file) {
            try {
              imageBase64 = await fileToDataUrl(priorityFile.file);
            } catch (error) {
              console.error('Attachment conversion error:', error);
              toast.error(language === 'hi' ? 'फ़ाइल पढ़ने में समस्या हुई' : 'Failed to process attachment');
            }
          }

          handleSend(msg, imageBase64, false, options?.reasoningMode || false);
        }} 
        isLoading={isLoading} 
        isDisabled={isResponding || messageLimitReached}
        webSearchEnabled={webSearchEnabled}
        onWebSearchToggle={setWebSearchEnabled}
        onDeepThinking={handleDeepThinking}
        onNewsSearch={handleNewsSearch}
        onInputFocus={handleInputFocus}
      />

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
