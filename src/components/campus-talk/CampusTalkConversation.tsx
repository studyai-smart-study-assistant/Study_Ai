
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Image as ImageIcon, Smile } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

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
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load messages
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

  // Scroll on new messages
  useEffect(() => { scrollToBottom(); }, [messages]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`conv-${chatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'campus_messages',
        filter: `chat_id=eq.${chatId}`,
      }, (payload) => {
        const newMsg = payload.new as Msg;
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [chatId]);

  const handleSend = async () => {
    if (!text.trim() || !currentUser || sending) return;
    const content = text.trim();
    setText('');
    setSending(true);

    try {
      const { error } = await supabase.from('campus_messages').insert({
        chat_id: chatId,
        sender_uid: currentUser.uid,
        text_content: content,
        message_type: 'text',
      });
      if (error) throw error;

      await supabase.from('campus_chats').update({
        last_message_at: new Date().toISOString()
      }).eq('id', chatId);
    } catch {
      toast.error('Message भेजने में error');
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    try {
      setSending(true);
      const ext = file.name.split('.').pop();
      const path = `campus-chat/${Date.now()}.${ext}`;
      
      const { error: upErr } = await supabase.storage.from('chat_media').upload(path, file);
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage.from('chat_media').getPublicUrl(path);

      await supabase.from('campus_messages').insert({
        chat_id: chatId,
        sender_uid: currentUser.uid,
        image_url: publicUrl,
        message_type: 'image',
      });

      await supabase.from('campus_chats').update({
        last_message_at: new Date().toISOString()
      }).eq('id', chatId);
    } catch {
      toast.error('Image भेजने में error');
    } finally {
      setSending(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const formatTime = (ts: string) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

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
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5 bg-[hsl(var(--muted)/0.3)]">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin h-7 w-7 border-3 border-[hsl(230,70%,55%)] border-t-transparent rounded-full" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-muted-foreground">Start a conversation with {partnerName} 👋</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_uid === currentUser?.uid;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                  isMine 
                    ? 'bg-[hsl(230,70%,55%)] text-white rounded-br-md' 
                    : 'bg-card text-foreground border border-border rounded-bl-md'
                }`}>
                  {msg.message_type === 'image' && msg.image_url ? (
                    <img 
                      src={msg.image_url} 
                      alt="Shared" 
                      className="rounded-lg max-w-full max-h-60 object-cover cursor-pointer"
                      onClick={() => window.open(msg.image_url!, '_blank')}
                    />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.text_content}</p>
                  )}
                  <p className={`text-[10px] mt-1 text-right ${isMine ? 'text-white/60' : 'text-muted-foreground'}`}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 bg-background border-t border-border px-3 py-2 flex items-center gap-2">
        <button 
          onClick={() => fileRef.current?.click()}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ImageIcon className="h-5 w-5" />
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Type a message..."
          className="flex-1 rounded-full bg-muted border-0"
          disabled={sending}
        />
        
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="p-2.5 rounded-full bg-[hsl(230,70%,55%)] text-white disabled:opacity-40 hover:bg-[hsl(230,70%,45%)] transition-colors"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default CampusTalkConversation;
