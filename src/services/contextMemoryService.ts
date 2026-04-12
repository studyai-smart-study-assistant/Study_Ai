import { supabase } from '@/integrations/supabase/client';

export interface ConversationEntry {
  id: string;
  message: string;
  response: string;
  timestamp: number;
  sender: 'user' | 'ai';
  context?: string;
}

interface UserContextMemory {
  userId: string;
  conversations: ConversationEntry[];
  lastUpdated: number;
  sessionStartTime: number;
}

interface UserContextMemoryRow {
  id: string;
  user_id: string;
  message: string;
  response: string;
  context: string | null;
  created_at: string;
}

class ContextMemoryService {
  private static instance: ContextMemoryService;
  private userContexts: Map<string, UserContextMemory> = new Map();
  private readonly MAX_CONVERSATIONS_PER_USER = 25;
  private readonly STORAGE_KEY_PREFIX = 'user_context_memory_';
  private readonly MIGRATION_CLEANUP_KEY = 'user_context_memory_migration_cleanup_v1';

  private constructor() {
    this.purgeLegacyLocalStorageKeys();
  }

  static getInstance(): ContextMemoryService {
    if (!ContextMemoryService.instance) {
      ContextMemoryService.instance = new ContextMemoryService();
    }
    return ContextMemoryService.instance;
  }

  private mapRowToConversation(row: UserContextMemoryRow): ConversationEntry {
    return {
      id: row.id,
      message: row.message,
      response: row.response,
      timestamp: new Date(row.created_at).getTime(),
      sender: 'user',
      context: row.context ?? undefined,
    };
  }

  private ensureUserContext(userId: string): UserContextMemory {
    const existing = this.userContexts.get(userId);
    if (existing) return existing;

    const initial: UserContextMemory = {
      userId,
      conversations: [],
      lastUpdated: Date.now(),
      sessionStartTime: Date.now(),
    };

    this.userContexts.set(userId, initial);
    return initial;
  }

  private async hydrateUserContext(userId: string, limit: number = this.MAX_CONVERSATIONS_PER_USER): Promise<ConversationEntry[]> {
    const supabaseAny = supabase as any;
    const { data, error } = await supabaseAny
      .from('user_context_memory')
      .select('id, user_id, message, response, context, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error(`❌ Error loading context for user ${userId}:`, error);
      return this.userContexts.get(userId)?.conversations ?? [];
    }

    const conversations = ((data ?? []) as UserContextMemoryRow[])
      .map((row) => this.mapRowToConversation(row))
      .sort((a, b) => a.timestamp - b.timestamp);

    const userContext = this.ensureUserContext(userId);
    userContext.conversations = conversations;
    userContext.lastUpdated = conversations.at(-1)?.timestamp ?? Date.now();

    return conversations;
  }

  async getUserContext(userId: string): Promise<ConversationEntry[]> {
    const conversations = await this.hydrateUserContext(userId);
    console.log(`📚 Retrieved ${conversations.length} conversations for user ${userId} from DB`);
    return conversations;
  }

  async addConversation(
    userId: string,
    userMessage: string,
    aiResponse: string,
    context?: string
  ): Promise<void> {
    const supabaseAny = supabase as any;
    const { data, error } = await supabaseAny
      .from('user_context_memory')
      .insert({
        user_id: userId,
        message: userMessage,
        response: aiResponse,
        context: context ?? null,
      })
      .select('id, user_id, message, response, context, created_at')
      .single();

    if (error) {
      console.error(`❌ Error saving context for user ${userId}:`, error);
      return;
    }

    const userContext = this.ensureUserContext(userId);
    userContext.conversations.push(this.mapRowToConversation(data as UserContextMemoryRow));

    if (userContext.conversations.length > this.MAX_CONVERSATIONS_PER_USER) {
      userContext.conversations = userContext.conversations.slice(-this.MAX_CONVERSATIONS_PER_USER);
    }

    userContext.lastUpdated = Date.now();
    console.log(`💾 Added DB-backed conversation for user ${userId}. Total cached: ${userContext.conversations.length}`);
  }

  async getRecentContext(userId: string, limit: number = 10): Promise<ConversationEntry[]> {
    const conversations = await this.hydrateUserContext(userId, Math.max(limit, this.MAX_CONVERSATIONS_PER_USER));
    const recentConversations = conversations.slice(-limit);
    console.log(`🔄 Retrieved ${recentConversations.length} recent conversations for user ${userId} from DB`);
    return recentConversations;
  }

  getConversationSummary(userId: string): string {
    const userContext = this.userContexts.get(userId);
    if (!userContext || userContext.conversations.length === 0) {
      return 'यह उपयोगकर्ता के साथ पहली बातचीत है।';
    }

    const totalConversations = userContext.conversations.length;
    const recentTopics = this.extractRecentTopics(userContext.conversations);
    const sessionDuration = Date.now() - userContext.sessionStartTime;
    const sessionMinutes = Math.floor(sessionDuration / (1000 * 60));

    return `उपयोगकर्ता के साथ ${totalConversations} बातचीत हो चुकी हैं। हाल के विषय: ${recentTopics.join(', ')}। सत्र की अवधि: ${sessionMinutes} मिनट।`;
  }

  private extractRecentTopics(conversations: ConversationEntry[]): string[] {
    const recentConversations = conversations.slice(-5);
    const topics: string[] = [];

    recentConversations.forEach((conv) => {
      const message = conv.message.toLowerCase();
      if (message.includes('गणित') || message.includes('math')) topics.push('गणित');
      if (message.includes('विज्ञान') || message.includes('science')) topics.push('विज्ञान');
      if (message.includes('इतिहास') || message.includes('history')) topics.push('इतिहास');
      if (message.includes('अंग्रेजी') || message.includes('english')) topics.push('अंग्रेजी');
      if (message.includes('study ai') || message.includes('ऐप')) topics.push('Study AI');
      if (message.includes('अजित कुमार') || message.includes('ajit')) topics.push('निर्माता');
    });

    return [...new Set(topics)];
  }

  async clearOldContexts(daysOld: number = 30): Promise<void> {
    const cutoffIso = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();
    const supabaseAny = supabase as any;
    const { error } = await supabaseAny
      .from('user_context_memory')
      .delete()
      .lt('created_at', cutoffIso);

    if (error) {
      console.error('❌ Error clearing old DB contexts:', error);
      return;
    }

    for (const [userId, context] of this.userContexts.entries()) {
      context.conversations = context.conversations.filter((entry) => entry.timestamp >= new Date(cutoffIso).getTime());
      context.lastUpdated = context.conversations.at(-1)?.timestamp ?? context.lastUpdated;
      this.userContexts.set(userId, context);
    }

    console.log('🧹 Cleared old user contexts from DB');
  }

  getTotalConversationCount(userId: string): number {
    const userContext = this.userContexts.get(userId);
    return userContext ? userContext.conversations.length : 0;
  }

  private purgeLegacyLocalStorageKeys(): void {
    try {
      if (localStorage.getItem(this.MIGRATION_CLEANUP_KEY) === 'done') {
        return;
      }

      const keysToRemove = Object.keys(localStorage).filter(
        (key) => key.startsWith(this.STORAGE_KEY_PREFIX) && key !== this.MIGRATION_CLEANUP_KEY,
      );

      keysToRemove.forEach((key) => localStorage.removeItem(key));
      localStorage.setItem(this.MIGRATION_CLEANUP_KEY, 'done');

      if (keysToRemove.length > 0) {
        console.log(`🧹 Purged ${keysToRemove.length} legacy user_context_memory_* localStorage keys`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to purge legacy context keys:', error);
    }
  }
}

export const contextMemoryService = ContextMemoryService.getInstance();
