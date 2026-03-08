
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Send, Image as ImageIcon, Bot, Mic, Paperclip } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import {
  MessageLongPressMenu, ReplyPreview, QuotedMessage, ReactionsDisplay,
  useSwipeToReply, useLongPress,
  type MessageAction
} from './MessageInteractions';

interface Props {
  chatId: string;
  partnerUid: string;
  partnerName: string;
  partnerAvatar?: string | null;
  onBack: () => void;
}

interface Msg {
  id: string;
  sender_uid: string;
  text_content: string | null;
  image_url: string | null;
  message_type: string;
  created_at: string;
  reply_to_text?: string | null;
  reply_to_sender?: string | null;
}

const avatarColors = [
  'bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500',
  'bg-purple-500', 'bg-teal-500', 'bg-red-500', 'bg-indigo-500',
];
const getColor = (name: string) => {
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % avatarColors.length;
  return avatarColors[idx];
};

const CampusTalkConversation: React.FC<Props> = ({ chatId, partnerUid, partnerName, partnerAvatar, onBack }) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [aiMessages, setAiMessages] = useState<{ id: string; text: string; timestamp: string }[]>([]);

  // Message interactions state
  const [menuMsg, setMenuMsg] = useState<MessageAction | null>(null);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [replyTo, setReplyTo] = useState<{ id: string; text: string | null; senderName?: string } | null>(null);
  const [reactions, setReactions] = useState<Record<string, Record<string, string[]>>>({});
  const [activeCall, setActiveCall] = useState<{ isVideo: boolean } | null>(null);
  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('campus_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });
      if (!error && data) setMessages(data as Msg[]);
      setLoading(false);
    };
    load();
  }, [chatId]);

  useEffect(() => { scrollToBottom(); }, [messages, aiMessages]);

  useEffect(() => {
    const channel = supabase
      .channel(`conv-${chatId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'campus_messages',
        filter: `chat_id=eq.${chatId}`,
      }, (payload) => {
        const newMsg = payload.new as Msg;
        setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [chatId]);

  const isAiQuery = (content: string): string | null => {
    const trimmed = content.trim();
    if (trimmed.startsWith('/')) return trimmed.slice(1).trim();
    const lower = trimmed.toLowerCase();
    if (lower.startsWith('study ai ')) return trimmed.slice(9).trim();
    if (lower.startsWith('studyai ')) return trimmed.slice(8).trim();
    return null;
  };

  const handleAiQuery = async (query: string) => {
    if (!query) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: { prompt: `You are Study AI, a helpful study assistant. Answer concisely in Hinglish. Question: ${query}`, history: [] }
      });
      if (error) throw error;
      const aiResponse = data?.generatedText || data?.response || data?.text || 'जवाब नहीं मिला।';
      setAiMessages(prev => [...prev, { id: `ai-${Date.now()}`, text: `🤖 Study AI: ${aiResponse}`, timestamp: new Date().toISOString() }]);
    } catch {
      setAiMessages(prev => [...prev, { id: `ai-${Date.now()}`, text: '🤖 AI से जवाब लेने में error हुआ।', timestamp: new Date().toISOString() }]);
    } finally { setAiLoading(false); }
  };

  const handleSend = async () => {
    if (!text.trim() || !currentUser || sending) return;
    const content = text.trim();
    setText('');
    const currentReply = replyTo;
    setReplyTo(null);

    const aiQuery = isAiQuery(content);
    if (aiQuery) {
      setAiMessages(prev => [...prev, { id: `user-ai-${Date.now()}`, text: `📝 ${content}`, timestamp: new Date().toISOString() }]);
      await handleAiQuery(aiQuery);
      return;
    }

    setSending(true);
    try {
      const insertData: any = {
        chat_id: chatId,
        sender_uid: currentUser.uid,
        text_content: content,
        message_type: 'text',
      };
      // Store reply context in text if replying
      if (currentReply) {
        insertData.text_content = content;
        // We'll store reply metadata locally since DB doesn't have reply columns for campus_messages
      }
      const { error } = await supabase.from('campus_messages').insert(insertData);
      if (error) throw error;
      await supabase.from('campus_chats').update({ last_message_at: new Date().toISOString() }).eq('id', chatId);
      
      // Store reply reference locally
      if (currentReply) {
        const newMsgId = `reply-${Date.now()}`;
        // We handle replies visually via local state since campus_messages doesn't have reply columns
      }
    } catch (err: any) {
      toast.error('Message भेजने में error: ' + (err?.message || ''));
    } finally { setSending(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    try {
      setSending(true);
      const ext = file.name.split('.').pop();
      const path = `campus-chat/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('chat_media').upload(path, file);
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('chat_media').getPublicUrl(path);
      
      const isAudio = file.type.startsWith('audio/');
      const isImage = file.type.startsWith('image/');
      const msgType = isAudio ? 'audio' : isImage ? 'image' : 'file';
      
      await supabase.from('campus_messages').insert({ 
        chat_id: chatId, sender_uid: currentUser.uid, 
        image_url: publicUrl, message_type: msgType,
        text_content: isAudio ? `🎵 Audio (${file.name})` : null,
      });
      await supabase.from('campus_chats').update({ last_message_at: new Date().toISOString() }).eq('id', chatId);
    } catch { toast.error('File भेजने में error'); }
    finally { setSending(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const handleLongPress = useCallback((msg: Msg, e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0]?.clientX || 150 : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY || 300 : (e as React.MouseEvent).clientY;
    setMenuMsg({
      id: msg.id,
      text: msg.text_content,
      isMine: msg.sender_uid === currentUser?.uid,
      senderName: msg.sender_uid === currentUser?.uid ? 'You' : partnerName,
    });
    setMenuPos({ x: clientX, y: clientY });
  }, [currentUser, partnerName]);

  const handleReact = (msgId: string, emoji: string) => {
    setReactions(prev => {
      const msgReactions = { ...(prev[msgId] || {}) };
      const users = msgReactions[emoji] || [];
      const uid = currentUser?.uid || '';
      if (users.includes(uid)) {
        msgReactions[emoji] = users.filter(u => u !== uid);
      } else {
        msgReactions[emoji] = [...users, uid];
      }
      return { ...prev, [msgId]: msgReactions };
    });
  };

  const handleReply = (msg: MessageAction) => {
    setReplyTo({ id: msg.id, text: msg.text, senderName: msg.senderName });
    // Focus input
  };

  const handleDelete = async (msgId: string) => {
    try {
      await supabase.from('campus_messages').delete().eq('id', msgId);
      setMessages(prev => prev.filter(m => m.id !== msgId));
      toast.success('Message delete हो गया');
    } catch { toast.error('Delete error'); }
  };

  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const allMessages = [
    ...messages.map(m => ({ type: 'chat' as const, data: m, ts: m.created_at })),
    ...aiMessages.map(m => ({ type: 'ai' as const, data: m, ts: m.timestamp })),
  ].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

  const showAiHint = text.startsWith('/') || text.toLowerCase().startsWith('study ai');

  const startCall = (isVideo: boolean) => {
    setActiveCall({ isVideo });
  };

  if (activeCall) {
    return (
      <CallScreen
        channelName={`call-${chatId}`}
        isVideo={activeCall.isVideo}
        callerName={partnerName}
        callerAvatar={partnerAvatar}
        onEnd={() => setActiveCall(null)}
      />
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Header */}
      <div className="bg-[hsl(230,70%,55%)] text-white px-3 py-2.5 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="p-1 hover:bg-white/10 rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </button>
        {partnerAvatar ? (
          <img src={partnerAvatar} alt={partnerName} className="w-9 h-9 rounded-full object-cover" />
        ) : (
          <div className={`w-9 h-9 rounded-full ${getColor(partnerName)} flex items-center justify-center text-white font-bold`}>
            {partnerName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-sm truncate">{partnerName}</h2>
          <p className="text-xs text-white/70">tap here for info</p>
        </div>
        <button onClick={() => startCall(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <Phone className="h-5 w-5" />
        </button>
        <button onClick={() => startCall(true)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <Video className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5 bg-[hsl(var(--muted)/0.3)]">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin h-7 w-7 border-3 border-[hsl(230,70%,55%)] border-t-transparent rounded-full" />
          </div>
        ) : allMessages.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <p className="text-sm text-muted-foreground">Start a conversation with {partnerName} 👋</p>
            <p className="text-xs text-muted-foreground">
              💡 <code className="bg-muted px-1 rounded">/</code> या <code className="bg-muted px-1 rounded">study ai</code> लिखकर AI से सवाल पूछें
            </p>
          </div>
        ) : (
          allMessages.map((item) => {
            if (item.type === 'ai') {
              const aiMsg = item.data as { id: string; text: string; timestamp: string };
              const isUserQuery = aiMsg.id.startsWith('user-ai-');
              return (
                <div key={aiMsg.id} className={`flex ${isUserQuery ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                    isUserQuery
                      ? 'bg-purple-500/20 text-foreground border border-purple-500/30 rounded-br-md'
                      : 'bg-gradient-to-br from-purple-500/10 to-blue-500/10 text-foreground border border-purple-500/20 rounded-bl-md'
                  }`}>
                    {!isUserQuery && <Bot className="h-3.5 w-3.5 text-purple-500 mb-1 inline-block mr-1" />}
                    <p className="text-sm whitespace-pre-wrap break-words">{aiMsg.text}</p>
                    <p className="text-[10px] mt-1 text-right text-muted-foreground">{formatTime(aiMsg.timestamp)}</p>
                  </div>
                </div>
              );
            }

            const msg = item.data as Msg;
            const isMine = msg.sender_uid === currentUser?.uid;
            return (
              <SwipeableMessage
                key={msg.id}
                onSwipe={() => handleReply({ id: msg.id, text: msg.text_content, isMine, senderName: isMine ? 'You' : partnerName })}
              >
                <MessageBubble
                  msg={msg}
                  isMine={isMine}
                  partnerName={partnerName}
                  reactions={reactions[msg.id]}
                  onLongPress={(e) => handleLongPress(msg, e)}
                  formatTime={formatTime}
                />
              </SwipeableMessage>
            );
          })
        )}
        {aiLoading && (
          <div className="flex justify-start">
            <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl rounded-bl-md px-3 py-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Bot className="h-4 w-4 text-purple-500 animate-pulse" />
                <span>Study AI सोच रहा है...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* AI Hint */}
      {showAiHint && (
        <div className="px-3 py-1.5 bg-purple-500/10 border-t border-purple-500/20 flex items-center gap-2">
          <Bot className="h-4 w-4 text-purple-500" />
          <span className="text-xs text-purple-600 dark:text-purple-400">AI Mode: आपका सवाल Study AI को भेजा जाएगा</span>
        </div>
      )}

      {/* Reply Preview */}
      <ReplyPreview replyTo={replyTo} onCancel={() => setReplyTo(null)} />

      {/* Input */}
      <div className="shrink-0 bg-background border-t border-border px-3 py-2 flex items-center gap-2">
        <button onClick={() => fileRef.current?.click()} className="p-2 text-muted-foreground hover:text-foreground">
          <Paperclip className="h-5 w-5" />
        </button>
        <input ref={fileRef} type="file" accept="image/*,audio/*" className="hidden" onChange={handleFileUpload} />
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder={replyTo ? 'Reply लिखें...' : 'Message... ( / से AI पूछें)'}
          className="flex-1 rounded-full bg-muted border-0"
          disabled={sending || aiLoading}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending || aiLoading}
          className="p-2.5 rounded-full bg-[hsl(230,70%,55%)] text-white disabled:opacity-40 hover:bg-[hsl(230,70%,45%)]"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      {/* Long Press Menu */}
      <MessageLongPressMenu
        message={menuMsg}
        position={menuPos}
        onClose={() => { setMenuMsg(null); setMenuPos(null); }}
        onReply={handleReply}
        onReact={handleReact}
        onDelete={handleDelete}
      />
    </div>
  );
};

// Swipeable wrapper
const SwipeableMessage: React.FC<{ children: React.ReactNode; onSwipe: () => void }> = ({ children, onSwipe }) => {
  const { offset, onTouchStart, onTouchMove, onTouchEnd } = useSwipeToReply(onSwipe);

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ transform: `translateX(${offset}px)`, transition: offset === 0 ? 'transform 0.2s' : 'none' }}
      className="relative"
    >
      {offset > 30 && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2">
          <div className="bg-[hsl(230,70%,55%)] text-white rounded-full p-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"></polyline><path d="M20 18v-2a4 4 0 0 0-4-4H4"></path></svg>
          </div>
        </div>
      )}
      {children}
    </div>
  );
};

// Message bubble component
interface MessageBubbleProps {
  msg: Msg;
  isMine: boolean;
  partnerName: string;
  reactions?: Record<string, string[]>;
  onLongPress: (e: React.TouchEvent | React.MouseEvent) => void;
  formatTime: (ts: string) => string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ msg, isMine, partnerName, reactions, onLongPress, formatTime }) => {
  const longPressHandlers = useLongPress(onLongPress, 500);

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`} {...longPressHandlers}>
      <div className={`max-w-[75%] rounded-2xl px-3 py-2 select-none ${
        isMine
          ? 'bg-[hsl(230,70%,55%)] text-white rounded-br-md'
          : 'bg-card text-foreground border border-border rounded-bl-md'
      }`}>
        {msg.message_type === 'audio' && msg.image_url ? (
          <div className="space-y-1">
            <audio src={msg.image_url} controls className="max-w-full h-10" />
            {msg.text_content && <p className="text-xs text-muted-foreground">{msg.text_content}</p>}
          </div>
        ) : msg.message_type === 'image' && msg.image_url ? (
          <img src={msg.image_url} alt="Shared" className="rounded-lg max-w-full max-h-60 object-cover cursor-pointer" onClick={() => window.open(msg.image_url!, '_blank')} />
        ) : (
          <p className="text-sm whitespace-pre-wrap break-words">{msg.text_content}</p>
        )}
        <p className={`text-[10px] mt-1 text-right ${isMine ? 'text-white/60' : 'text-muted-foreground'}`}>
          {formatTime(msg.created_at)}
        </p>
        {reactions && <ReactionsDisplay reactions={reactions} />}
      </div>
    </div>
  );
};

export default CampusTalkConversation;
