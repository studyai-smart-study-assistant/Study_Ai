import { supabase } from '@/integrations/supabase/client';

export interface MessageMetadata {
  bookmarked?: boolean;
  liked?: boolean;
  editedAt?: number;
}

export interface ChatMessage extends MessageMetadata {
  id: string;
  chatId: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: number;
}

export interface ConversationHeader {
  id: string;
  title: string;
  timestamp: number;
}

export interface Conversation extends ConversationHeader {
  messages: ChatMessage[];
}

export interface MessagePage {
  messages: ChatMessage[];
  hasMore: boolean;
  nextCursor: string | null;
}

const DEFAULT_PAGE_SIZE = 30;

const mapRole = (messageType: string | null): 'user' | 'bot' =>
  messageType === 'bot' ? 'bot' : 'user';

const mapMessageRow = (row: any): ChatMessage => ({
  id: row.id,
  chatId: row.chat_id,
  role: mapRole(row.message_type),
  content: row.text_content ?? '',
  timestamp: new Date(row.created_at).getTime(),
  bookmarked: !!row.message_metadata?.bookmarked,
  liked: !!row.message_metadata?.liked,
  editedAt: row.edited_at ? new Date(row.edited_at).getTime() : undefined,
});

const computeTitle = (messages: ChatMessage[]) => {
  const firstUser = messages.find((message) => message.role === 'user' && message.content.trim());
  if (!firstUser) return 'New Chat';
  const content = firstUser.content.trim();
  return content.slice(0, 30) + (content.length > 30 ? '...' : '');
};

export class SupabaseChatRepository {
  private async requireUserId(): Promise<string> {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user?.id) {
      throw new Error('User session required for chat access');
    }
    return data.user.id;
  }

  async getAllChats(): Promise<Conversation[]> {
    const userId = await this.requireUserId();
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (conversationsError) throw conversationsError;

    const chatIds = (conversations ?? []).map((conversation) => conversation.id);
    if (!chatIds.length) return [];

    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('id, chat_id, message_type, text_content, created_at, edited_at')
      .in('chat_id', chatIds)
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;

    const messagesByChat = new Map<string, ChatMessage[]>();
    for (const row of messages ?? []) {
      const mapped = mapMessageRow(row);
      const list = messagesByChat.get(mapped.chatId) ?? [];
      list.push(mapped);
      messagesByChat.set(mapped.chatId, list);
    }

    return (conversations ?? []).map((conversation) => {
      const chatMessages = messagesByChat.get(conversation.id) ?? [];
      const lastMessageTs = chatMessages[chatMessages.length - 1]?.timestamp;
      return {
        id: conversation.id,
        title: computeTitle(chatMessages),
        timestamp: lastMessageTs ?? new Date(conversation.created_at).getTime(),
        messages: chatMessages,
      };
    });
  }

  async getChat(id: string, pageSize: number = DEFAULT_PAGE_SIZE): Promise<Conversation | null> {
    const userId = await this.requireUserId();
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id, created_at')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (conversationError) throw conversationError;
    if (!conversation) return null;

    const page = await this.getMessagesPage(id, { limit: pageSize });
    const latestTimestamp = page.messages[page.messages.length - 1]?.timestamp;

    return {
      id: conversation.id,
      title: computeTitle(page.messages),
      timestamp: latestTimestamp ?? new Date(conversation.created_at).getTime(),
      messages: page.messages,
    };
  }

  async getMessagesPage(
    chatId: string,
    options: { limit?: number; before?: string } = {}
  ): Promise<MessagePage> {
    const limit = options.limit ?? DEFAULT_PAGE_SIZE;
    let query = supabase
      .from('chat_messages')
      .select('id, chat_id, message_type, text_content, created_at, edited_at')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false })
      .limit(limit + 1);

    if (options.before) {
      query = query.lt('created_at', options.before);
    }

    const { data, error } = await query;
    if (error) throw error;

    const rows = data ?? [];
    const hasMore = rows.length > limit;
    const trimmed = hasMore ? rows.slice(0, limit) : rows;
    const ascending = [...trimmed].reverse();
    const messages = ascending.map(mapMessageRow);
    const nextCursor = hasMore ? trimmed[trimmed.length - 1].created_at : null;

    return { messages, hasMore, nextCursor };
  }

  async createNewChat(): Promise<Conversation> {
    const userId = await this.requireUserId();
    const { data, error } = await supabase
      .from('conversations')
      .insert({ user_id: userId })
      .select('id, created_at')
      .single();

    if (error) throw error;

    return {
      id: data.id,
      title: 'New Chat',
      timestamp: new Date(data.created_at).getTime(),
      messages: [],
    };
  }

  async updateChatTitle(_id: string, _title: string): Promise<void> {
    void _id;
    void _title;
    // Title is derived from messages until a dedicated column exists in conversations.
  }

  async saveChat(chat: Conversation): Promise<void> {
    await this.updateChatTitle(chat.id, chat.title);
  }

  async deleteChat(id: string): Promise<void> {
    const userId = await this.requireUserId();
    const { error } = await supabase.from('conversations').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
  }

  async addMessage(chatId: string, content: string, role: 'user' | 'bot'): Promise<ChatMessage> {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        chat_id: chatId,
        sender_id: role,
        message_type: role,
        text_content: content,
      })
      .select('id, chat_id, message_type, text_content, created_at, edited_at')
      .single();

    if (error) throw error;
    return mapMessageRow(data);
  }

  async editMessage(chatId: string, messageId: string, content: string): Promise<void> {
    const { error } = await supabase
      .from('chat_messages')
      .update({ text_content: content, edited_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('chat_id', chatId);

    if (error) throw error;
  }

  async deleteMessage(chatId: string, messageId: string): Promise<void> {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId)
      .eq('chat_id', chatId);

    if (error) throw error;
  }

  async toggleMessageBookmark(chatId: string, messageId: string): Promise<boolean> {
    const { data: existing, error: selectError } = await supabase
      .from('message_metadata')
      .select('bookmarked')
      .eq('message_id', messageId)
      .maybeSingle();

    if (selectError) throw selectError;

    const bookmarked = !(existing?.bookmarked ?? false);
    const { error: upsertError } = await supabase.from('message_metadata').upsert(
      {
        chat_id: chatId,
        message_id: messageId,
        bookmarked,
      },
      { onConflict: 'message_id' }
    );

    if (upsertError) throw upsertError;
    return bookmarked;
  }

  subscribeToMessages(chatId: string, onChange: () => void): () => void {
    const channel = supabase
      .channel(`conversation-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_id=eq.${chatId}`,
        },
        () => onChange()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const supabaseChatRepo = new SupabaseChatRepository();
