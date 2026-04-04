import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ImagePlus, Paperclip, Send, Sparkles, Users } from 'lucide-react';
import { toast } from 'sonner';
import { streamChatCompletion } from '@/lib/streamingChat';

interface GroupInfo {
  id: string;
  name: string;
  invite_code: string;
  creator_id: string;
}

interface GroupMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface GroupMember {
  user_id: string;
}

export default function GroupStudyRoom() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [reasoningMode, setReasoningMode] = useState(false);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | undefined>();
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const isLoggedIn = !!currentUser?.uid;
  const currentUid = currentUser?.uid;

  useEffect(() => {
    if (!groupId || !currentUid) return;
    loadGroupData();

    const messagesChannel = supabase
      .channel(`study-group-messages-${groupId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'study_group_messages',
        filter: `group_id=eq.${groupId}`,
      }, () => {
        loadMessages(groupId);
      })
      .subscribe();

    const membersChannel = supabase
      .channel(`study-group-members-room-${groupId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'group_participants',
        filter: `group_id=eq.${groupId}`,
      }, () => {
        loadMembers(groupId);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(membersChannel);
    };
  }, [groupId, currentUid]);

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [messages],
  );

  const loadGroupData = async () => {
    if (!groupId || !currentUid) return;

    const { data: groupData } = await supabase
      .from('study_groups')
      .select('id, name, invite_code, creator_id')
      .eq('id', groupId)
      .maybeSingle();

    if (!groupData) {
      toast.error('Group not found.');
      navigate('/');
      return;
    }

    const { data: membership } = await supabase
      .from('group_participants')
      .select('group_id')
      .eq('group_id', groupId)
      .eq('user_id', currentUid)
      .eq('is_active', true)
      .maybeSingle();

    if (!membership) {
      toast.error('Please join this group first.');
      navigate('/');
      return;
    }

    setGroup(groupData as GroupInfo);
    await Promise.all([loadMessages(groupId), loadMembers(groupId)]);
  };

  const loadMessages = async (id: string) => {
    const { data } = await supabase
      .from('study_group_messages')
      .select('id, sender_id, content, created_at')
      .eq('group_id', id)
      .order('created_at', { ascending: true })
      .limit(300);

    setMessages((data || []) as GroupMessage[]);
  };

  const loadMembers = async (id: string) => {
    const { data } = await supabase
      .from('group_participants')
      .select('user_id')
      .eq('group_id', id)
      .eq('is_active', true);

    const memberRows = (data || []) as GroupMember[];
    setMembers(memberRows);

    const memberIds = memberRows.map((m) => m.user_id);
    if (!memberIds.length) return;

    const { data: profileRows } = await supabase
      .from('profiles')
      .select('user_id, display_name, email')
      .in('user_id', memberIds);

    const map: Record<string, string> = {};
    for (const row of profileRows || []) {
      map[row.user_id] = row.display_name || row.email || row.user_id.slice(0, 8);
    }
    setProfiles(map);
  };

  const sendMessage = async () => {
    if (!groupId || !currentUid || !messageInput.trim() || sending) return;

    setSending(true);
    const promptWithAttachment = selectedFileName
      ? `${messageInput.trim()}\n\n[Attachment: ${selectedFileName}]`
      : messageInput.trim();

    const { error } = await supabase.from('study_group_messages').insert({
      group_id: groupId,
      sender_id: currentUid,
      content: promptWithAttachment,
    });

    if (error) {
      setSending(false);
      toast.error(error.message || 'Message भेजने में समस्या आई।');
      return;
    }

    const localHistory = [...sortedMessages, {
      id: `local-${Date.now()}`,
      sender_id: currentUid,
      content: promptWithAttachment,
      created_at: new Date().toISOString(),
    }];

    let aiResponse = '';
    await streamChatCompletion(
      {
        prompt: messageInput.trim(),
        imageBase64: selectedImageBase64,
        groupId,
        reasoningMode,
        history: localHistory.slice(-20).map((m) => ({
          role: m.sender_id === 'ai-assistant' ? 'assistant' : 'user',
          content: m.sender_id === 'ai-assistant' ? m.content : `${profiles[m.sender_id] || m.sender_id}: ${m.content}`,
        })),
      },
      {
        onToken: (token) => {
          aiResponse += token;
        },
        onStatus: () => {},
        onToolsUsed: () => {},
        onDone: () => {},
        onError: (err) => {
          console.error(err);
        },
      },
    );

    if (aiResponse.trim()) {
      await supabase.from('study_group_messages').insert({
        group_id: groupId,
        sender_id: 'ai-assistant',
        content: aiResponse.trim(),
      });
    }

    setMessageInput('');
    setSelectedImageBase64(undefined);
    setSelectedFileName(null);
    setSending(false);
  };

  const onImageSelect = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImageBase64(reader.result as string);
      setSelectedFileName(file.name);
      toast.success('Image attached.');
    };
    reader.readAsDataURL(file);
  };

  const onFileSelect = async (file?: File | null) => {
    if (!file) return;
    setSelectedFileName(file.name);
    setSelectedImageBase64(undefined);
    toast.success('File attached.');
  };

  const leaveGroup = async () => {
    if (!groupId || !currentUid) return;

    await supabase
      .from('group_participants')
      .update({ is_active: false })
      .eq('group_id', groupId)
      .eq('user_id', currentUid);

    toast.success('You left the group. You can rejoin from Group button anytime.');
    navigate('/');
  };

  if (!isLoggedIn) {
    return (
      <div className="h-[100dvh] flex items-center justify-center p-4">
        <Button onClick={() => navigate('/login')}>Login to continue</Button>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      <header className="border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <p className="font-semibold truncate">{group?.name || 'Group Study'}</p>
            <p className="text-xs text-muted-foreground">Code: {group?.invite_code || '---'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1"><Users className="h-3 w-3" />{members.length}</Badge>
          <Button variant="outline" size="sm" onClick={leaveGroup}>Leave</Button>
        </div>
      </header>

      <ScrollArea className="flex-1 px-4 py-3">
        <div className="space-y-2 max-w-3xl mx-auto">
          {sortedMessages.map((msg) => {
            const mine = msg.sender_id === currentUid;
            const senderName = msg.sender_id === 'ai-assistant'
              ? 'Study AI'
              : (profiles[msg.sender_id] || msg.sender_id.slice(0, 8));
            return (
              <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[82%] rounded-xl px-3 py-2 border ${mine ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
                  <p className={`text-[11px] mb-1 ${mine ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{mine ? 'You' : senderName}</p>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="border-t p-3">
        <div className="max-w-3xl mx-auto space-y-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={reasoningMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setReasoningMode((prev) => !prev)}
            >
              <Sparkles className="h-4 w-4 mr-1" /> Reasoning
            </Button>
            <label className="inline-flex">
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onImageSelect(e.target.files?.[0])} />
              <span className="inline-flex">
                <Button type="button" variant="outline" size="sm" asChild>
                  <span><ImagePlus className="h-4 w-4 mr-1" /> Image</span>
                </Button>
              </span>
            </label>
            <label className="inline-flex">
              <input type="file" className="hidden" onChange={(e) => onFileSelect(e.target.files?.[0])} />
              <span className="inline-flex">
                <Button type="button" variant="outline" size="sm" asChild>
                  <span><Paperclip className="h-4 w-4 mr-1" /> File</span>
                </Button>
              </span>
            </label>
            {selectedFileName && <Badge variant="secondary" className="truncate max-w-[160px]">{selectedFileName}</Badge>}
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type your question to study together..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button onClick={sendMessage} disabled={sending || !messageInput.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
