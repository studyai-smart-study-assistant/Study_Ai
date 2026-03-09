
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

  // ── Deep Thinking: calls edge function with Tavily multi-search ──
  const handleDeepThinking = useCallback(async (topic: string) => {
    toast.info(language === 'hi'
      ? `🔭 "${topic}" पर गहन रिसर्च हो रही है... कृपया प्रतीक्षा करें (30-60 sec)`
      : `🔭 Deep research on "${topic}"... please wait (30-60 sec)`,
      { duration: 8000 }
    );

    // Save user message to chat
    const userMsg = await chatDB.addMessage(chatId, `🔭 Deep Thinking: ${topic}`, 'user');
    if (onChatUpdated) onChatUpdated();
    await loadMessages();
    scrollToBottom();

    try {
      const { data, error } = await supabase.functions.invoke('deep-thinking', {
        body: { topic },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Deep thinking failed');

      // Save sources for display
      if (data.sources?.length > 0) setDeepThinkingSources(data.sources);

      // Format response with search count info
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
      // Fallback to normal AI
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
        onSend={handleSend} 
        isLoading={isLoading} 
        isDisabled={isResponding || messageLimitReached}
        webSearchEnabled={webSearchEnabled}
        onWebSearchToggle={setWebSearchEnabled}
        onDeepThinking={handleDeepThinking}
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
