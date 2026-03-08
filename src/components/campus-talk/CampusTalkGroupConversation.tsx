
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Image as ImageIcon, Bot, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import type { CampusGroup } from './CampusTalkGroupList';
import CampusTalkGroupSettings from './CampusTalkGroupSettings';

interface GMsg {
  id: string;
  sender_uid: string;
  text_content: string | null;
  image_url: string | null;
  message_type: string;
  created_at: string;
  is_ai_response: boolean;
  sender_name?: string;
}

const avatarColors = [
  'bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500',
  'bg-purple-500', 'bg-teal-500', 'bg-red-500', 'bg-indigo-500',
];
const getColor = (name: string) => {
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % avatarColors.length;
  return avatarColors[idx];
};

interface Props {
  group: CampusGroup;
  onBack: () => void;
}

const CampusTalkGroupConversation: React.FC<Props> = ({ group, onBack }) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<GMsg[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [myRole, setMyRole] = useState(group.my_role || 'member');
  const [namesMap, setNamesMap] = useState<Record<string, string>>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' });

  // Load member names
  useEffect(() => {
    const loadNames = async () => {
      const { data: members } = await supabase
        .from('campus_group_members' as any)
        .select('user_uid, role')
        .eq('group_id', group.id);

      if (!members) return;
      const uids = (members as any[]).map((m: any) => m.user_uid);
      const myMember = (members as any[]).find((m: any) => m.user_uid === currentUser?.uid);
      if (myMember) setMyRole((myMember as any).role);

      const { data: profiles } = await supabase
        .from('campus_users')
        .select('firebase_uid, display_name')
        .in('firebase_uid', uids);

      const map: Record<string, string> = {};
      (profiles || []).forEach(p => { map[p.firebase_uid] = p.display_name || p.firebase_uid.slice(0, 6); });
      map['study-ai'] = '🤖 Study AI';
      setNamesMap(map);
    };
    loadNames();
  }, [group.id, currentUser]);

  // Load messages
  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('campus_group_messages' as any)
        .select('*')
        .eq('group_id', group.id)
        .order('created_at', { ascending: true });

      if (!error && data) setMessages(data as any as GMsg[]);
      setLoading(false);
    };
    load();
  }, [group.id]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`group-conv-${group.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'campus_group_messages',
        filter: `group_id=eq.${group.id}`,
      }, (payload) => {
        const newMsg = payload.new as any as GMsg;
        setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [group.id]);

  const canSend = !group.only_admins_send || myRole === 'owner' || myRole === 'admin';

  const isAiQuery = (content: string): string | null => {
    const trimmed = content.trim();
    if (trimmed.startsWith('/')) return trimmed.slice(1).trim();
    const lower = trimmed.toLowerCase();
    if (lower.startsWith('study ai ')) return trimmed.slice(9).trim();
    if (lower.startsWith('studyai ')) return trimmed.slice(8).trim();
    return null;
  };

  const handleAiQuery = async (query: string) => {
    if (!query || !currentUser) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: {
          prompt: `You are Study AI in a group chat. Answer concisely in Hinglish. Question: ${query}`,
          history: []
        }
      });
      if (error) throw error;
      const aiResponse = data?.generatedText || data?.response || data?.text || 'जवाब नहीं मिला।';

      // Save AI response to group messages so everyone can see
      await supabase.from('campus_group_messages' as any).insert({
        group_id: group.id,
        sender_uid: 'study-ai',
        text_content: `🤖 Study AI: ${aiResponse}`,
        message_type: 'text',
        is_ai_response: true,
      });
    } catch (err) {
      console.error('AI error:', err);
      toast.error('AI से जवाब नहीं मिला');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSend = async () => {
    if (!text.trim() || !currentUser || sending) return;
    const content = text.trim();
    setText('');

    const aiQuery = isAiQuery(content);

    // Send user message first
    setSending(true);
    try {
      await supabase.from('campus_group_messages' as any).insert({
        group_id: group.id,
        sender_uid: currentUser.uid,
        text_content: content,
        message_type: 'text',
      });
    } catch (err: any) {
      toast.error('Message भेजने में error');
    } finally {
      setSending(false);
    }

    // If AI query, fetch and save response
    if (aiQuery) await handleAiQuery(aiQuery);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    try {
      setSending(true);
      const path = `campus-group/${group.id}/${Date.now()}.${file.name.split('.').pop()}`;
      const { error: upErr } = await supabase.storage.from('chat_media').upload(path, file);
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('chat_media').getPublicUrl(path);
      await supabase.from('campus_group_messages' as any).insert({
        group_id: group.id,
        sender_uid: currentUser.uid,
        image_url: publicUrl,
        message_type: 'image',
      });
    } catch { toast.error('Image भेजने में error'); }
    finally { setSending(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const showAiHint = text.startsWith('/') || text.toLowerCase().startsWith('study ai');

  if (showSettings) {
    return (
      <CampusTalkGroupSettings
        group={group}
        myRole={myRole}
        onBack={() => setShowSettings(false)}
        onGroupUpdated={() => {}}
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
        {group.avatar_url ? (
          <img src={group.avatar_url} alt={group.name} className="w-9 h-9 rounded-full object-cover" />
        ) : (
          <div className={`w-9 h-9 rounded-full ${getColor(group.name)} flex items-center justify-center text-white font-bold`}>
            {group.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0" onClick={() => setShowSettings(true)}>
          <h2 className="font-semibold text-sm truncate">{group.name}</h2>
          <p className="text-xs text-white/70">{group.member_count || 0} members • tap for settings</p>
        </div>
        <button onClick={() => setShowSettings(true)} className="p-1.5 hover:bg-white/10 rounded-full">
          <Settings className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5 bg-[hsl(var(--muted)/0.3)]">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin h-7 w-7 border-3 border-[hsl(230,70%,55%)] border-t-transparent rounded-full" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <p className="text-sm text-muted-foreground">Group में पहला message भेजें 👋</p>
            <p className="text-xs text-muted-foreground">
              💡 <code className="bg-muted px-1 rounded">/</code> से AI पूछें - सबको दिखेगा
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_uid === currentUser?.uid;
            const isAi = msg.is_ai_response || msg.sender_uid === 'study-ai';
            const senderName = namesMap[msg.sender_uid] || msg.sender_uid.slice(0, 6);

            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                  isAi
                    ? 'bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-bl-md'
                    : isMine
                      ? 'bg-[hsl(230,70%,55%)] text-white rounded-br-md'
                      : 'bg-card text-foreground border border-border rounded-bl-md'
                }`}>
                  {!isMine && (
                    <p className={`text-xs font-semibold mb-0.5 ${isAi ? 'text-purple-500' : 'text-[hsl(230,70%,55%)]'}`}>
                      {senderName}
                    </p>
                  )}
                  {msg.message_type === 'image' && msg.image_url ? (
                    <img src={msg.image_url} alt="Shared" className="rounded-lg max-w-full max-h-60 object-cover cursor-pointer" onClick={() => window.open(msg.image_url!, '_blank')} />
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
          <span className="text-xs text-purple-600 dark:text-purple-400">
            AI Mode: जवाब सभी members को दिखेगा
          </span>
        </div>
      )}

      {/* Input */}
      {canSend ? (
        <div className="shrink-0 bg-background border-t border-border px-3 py-2 flex items-center gap-2">
          <button onClick={() => fileRef.current?.click()} className="p-2 text-muted-foreground hover:text-foreground">
            <ImageIcon className="h-5 w-5" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <Input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Message... ( / से AI पूछें)"
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
      ) : (
        <div className="shrink-0 bg-muted border-t border-border px-3 py-3 text-center">
          <p className="text-xs text-muted-foreground">सिर्फ Admin/Owner message भेज सकते हैं</p>
        </div>
      )}
    </div>
  );
};

export default CampusTalkGroupConversation;
