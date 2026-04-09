interface ConversationEntry {
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

class ContextMemoryService {
  private static instance: ContextMemoryService;
  private userContexts: Map<string, UserContextMemory> = new Map();
  private readonly MAX_CONVERSATIONS_PER_USER = 25; // Increased from 6 to 25
  private readonly STORAGE_KEY_PREFIX = 'user_context_memory_';

  private constructor() {
    this.loadAllUserContexts();
  }

  static getInstance(): ContextMemoryService {
    if (!ContextMemoryService.instance) {
      ContextMemoryService.instance = new ContextMemoryService();
    }
    return ContextMemoryService.instance;
  }

  // Load user contexts from localStorage on initialization
  private loadAllUserContexts(): void {
    try {
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith(this.STORAGE_KEY_PREFIX)
      );
      
      keys.forEach(key => {
        const userData = localStorage.getItem(key);
        if (userData) {
          const userContext: UserContextMemory = JSON.parse(userData);
          this.userContexts.set(userContext.userId, userContext);
        }
      });
      
      console.log(`📚 Loaded ${keys.length} user contexts from localStorage`);
    } catch (error) {
      console.error('❌ Error loading user contexts:', error);
    }
  }

  // Get user-specific conversation history
  getUserContext(userId: string): ConversationEntry[] {
    const userContext = this.userContexts.get(userId);
    if (!userContext) {
      console.log(`📝 No existing context for user ${userId}`);
      return [];
    }
    
    console.log(`📚 Retrieved ${userContext.conversations.length} conversations for user ${userId}`);
    return userContext.conversations;
  }

  // Add new conversation entry for a specific user
  addConversation(
    userId: string, 
    userMessage: string, 
    aiResponse: string, 
    context?: string
  ): void {
    let userContext = this.userContexts.get(userId);
    
    if (!userContext) {
      userContext = {
        userId,
        conversations: [],
        lastUpdated: Date.now(),
        sessionStartTime: Date.now()
      };
      this.userContexts.set(userId, userContext);
      console.log(`🆕 Created new context memory for user ${userId}`);
    }

    // Create conversation entry
    const conversationEntry: ConversationEntry = {
      id: crypto.randomUUID(),
      message: userMessage,
      response: aiResponse,
      timestamp: Date.now(),
      sender: 'user',
      context
    };

    // Add to conversations array
    userContext.conversations.push(conversationEntry);

    // Keep only the last MAX_CONVERSATIONS_PER_USER entries
    if (userContext.conversations.length > this.MAX_CONVERSATIONS_PER_USER) {
      userContext.conversations = userContext.conversations.slice(-this.MAX_CONVERSATIONS_PER_USER);
      console.log(`✂️ Trimmed conversation history for user ${userId} to ${this.MAX_CONVERSATIONS_PER_USER} entries`);
    }

    userContext.lastUpdated = Date.now();
    
    // Save to localStorage
    this.saveUserContext(userId);
    
    console.log(`💾 Added conversation for user ${userId}. Total conversations: ${userContext.conversations.length}`);
  }

  // Get recent conversation context for AI processing
  getRecentContext(userId: string, limit: number = 10): ConversationEntry[] {
    const userContext = this.userContexts.get(userId);
    if (!userContext) return [];
    
    const recentConversations = userContext.conversations.slice(-limit);
    console.log(`🔄 Retrieved ${recentConversations.length} recent conversations for user ${userId}`);
    return recentConversations;
  }

  // Get conversation summary for contextual understanding
  getConversationSummary(userId: string): string {
    const userContext = this.userContexts.get(userId);
    if (!userContext || userContext.conversations.length === 0) {
      return "यह उपयोगकर्ता के साथ पहली बातचीत है।";
    }

    const totalConversations = userContext.conversations.length;
    const recentTopics = this.extractRecentTopics(userContext.conversations);
    const sessionDuration = Date.now() - userContext.sessionStartTime;
    const sessionMinutes = Math.floor(sessionDuration / (1000 * 60));

    return `उपयोगकर्ता के साथ ${totalConversations} बातचीत हो चुकी हैं। हाल के विषय: ${recentTopics.join(', ')}। सत्र की अवधि: ${sessionMinutes} मिनट।`;
  }

  // Extract topics from recent conversations
  private extractRecentTopics(conversations: ConversationEntry[]): string[] {
    const recentConversations = conversations.slice(-5);
    const topics: string[] = [];
    
    recentConversations.forEach(conv => {
      // Simple topic extraction based on common keywords
      const message = conv.message.toLowerCase();
      if (message.includes('गणित') || message.includes('math')) topics.push('गणित');
      if (message.includes('विज्ञान') || message.includes('science')) topics.push('विज्ञान');
      if (message.includes('इतिहास') || message.includes('history')) topics.push('इतिहास');
      if (message.includes('अंग्रेजी') || message.includes('english')) topics.push('अंग्रेजी');
      if (message.includes('study ai') || message.includes('ऐप')) topics.push('Study AI');
      if (message.includes('अजित कुमार') || message.includes('ajit')) topics.push('निर्माता');
    });
    
    return [...new Set(topics)]; // Remove duplicates
  }

  // Save user context to localStorage
  private saveUserContext(userId: string): void {
    try {
      const userContext = this.userContexts.get(userId);
      if (userContext) {
        const storageKey = `${this.STORAGE_KEY_PREFIX}${userId}`;
        localStorage.setItem(storageKey, JSON.stringify(userContext));
        console.log(`💾 Saved context for user ${userId} to localStorage`);
      }
    } catch (error) {
      console.error(`❌ Error saving context for user ${userId}:`, error);
    }
  }

  // Clear old contexts (cleanup utility)
  clearOldContexts(daysOld: number = 30): void {
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    let clearedCount = 0;
    
    this.userContexts.forEach((context, userId) => {
      if (context.lastUpdated < cutoffTime) {
        this.userContexts.delete(userId);
        localStorage.removeItem(`${this.STORAGE_KEY_PREFIX}${userId}`);
        clearedCount++;
      }
    });
    
    console.log(`🧹 Cleared ${clearedCount} old user contexts`);
  }

  // Get total conversation count for a user
  getTotalConversationCount(userId: string): number {
    const userContext = this.userContexts.get(userId);
    return userContext ? userContext.conversations.length : 0;
  }
}

// Export singleton instance
export const contextMemoryService = ContextMemoryService.getInstance();
