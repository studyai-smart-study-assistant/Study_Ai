
import { getCustomResponse, isAppSpecificQuery } from './responseHandler';
import { contextMemoryService } from '../services/contextMemoryService';

interface ConversationMessage {
  sender: 'user' | 'ai';
  text: string;
  timestamp?: number;
}

interface ChatStats {
  customResponses: number;
  apiCalls: number;
  totalQueries: number;
  customResponsePercentage: string;
}

interface QueryResult {
  response: string;
  source: 'custom' | 'api';
}

class EnhancedChatHandler {
  private stats: ChatStats = {
    customResponses: 0,
    apiCalls: 0,
    totalQueries: 0,
    customResponsePercentage: '0%'
  };

  async processQuery(
    userQuery: string, 
    apiCallFunction: (query: string) => Promise<string>,
    conversationHistory: ConversationMessage[] = [],
    userId?: string
  ): Promise<QueryResult> {
    
    console.log('[ENHANCED CHAT HANDLER] Processing query:', userQuery);
    console.log('[ENHANCED CHAT HANDLER] User ID:', userId);
    
    this.stats.totalQueries++;

    try {
      // Get user-specific conversation context if userId is provided
      let enhancedConversationHistory = conversationHistory;
      
      if (userId) {
        const userSpecificContext = contextMemoryService.getRecentContext(userId, 15);
        console.log(`[ENHANCED CHAT HANDLER] Retrieved ${userSpecificContext.length} user-specific conversations`);
        
        const contextMessages: ConversationMessage[] = userSpecificContext.flatMap(entry => [
          { sender: 'user', text: entry.message, timestamp: entry.timestamp },
          { sender: 'ai', text: entry.response, timestamp: entry.timestamp }
        ]);
        
        enhancedConversationHistory = [...contextMessages, ...conversationHistory].slice(-20);
      }

      console.log(`[ENHANCED CHAT HANDLER] Enhanced conversation context: ${enhancedConversationHistory.length} messages`);

      // Try to get custom response ONLY for Ajit Kumar and Study AI related queries
      const customResponseResult = getCustomResponse(userQuery, enhancedConversationHistory);
      
      if (customResponseResult && customResponseResult.response) {
        console.log('[ENHANCED CHAT HANDLER] ✅ Custom response found (Ajit Kumar/Study AI specific)');
        
        this.stats.customResponses++;
        this.updateCustomResponsePercentage();
        
        // Save this conversation to user's context memory
        if (userId) {
          contextMemoryService.addConversation(userId, userQuery, customResponseResult.response, 'custom_response');
        }
        
        return {
          response: customResponseResult.response,
          source: 'custom'
        };
      }

      // For ALL OTHER queries (including general study questions, math, science, etc.) - use Gemini API
      console.log('[ENHANCED CHAT HANDLER] 🔄 Query not related to Ajit Kumar/Study AI - using Gemini API');
      
      const apiResponse = await apiCallFunction(userQuery);
      this.stats.apiCalls++;
      this.updateCustomResponsePercentage();
      
      // Save API response to user context as well
      if (userId) {
        contextMemoryService.addConversation(userId, userQuery, apiResponse, 'api_response');
      }
      
      return {
        response: apiResponse,
        source: 'api'
      };

    } catch (error) {
      console.error('[ENHANCED CHAT HANDLER] ❌ Error processing query:', error);
      
      // Fallback to API on error
      console.log('[ENHANCED CHAT HANDLER] 🔄 Falling back to API due to error');
      
      try {
        const apiResponse = await apiCallFunction(userQuery);
        this.stats.apiCalls++;
        this.updateCustomResponsePercentage();
        
        if (userId) {
          contextMemoryService.addConversation(userId, userQuery, apiResponse, 'api_fallback');
        }
        
        return {
          response: apiResponse,
          source: 'api'
        };
      } catch (apiError) {
        console.error('[ENHANCED CHAT HANDLER] ❌ API fallback also failed:', apiError);
        
        // Ultimate fallback
        const ultimateFallback = "मुझे खुशी होगी आपकी मदद करने में, लेकिन अभी कुछ technical issue है। कृपया थोड़ी देर बाद try करें। 🙏";
        
        if (userId) {
          contextMemoryService.addConversation(userId, userQuery, ultimateFallback, 'error_fallback');
        }
        
        return {
          response: ultimateFallback,
          source: 'custom'
        };
      }
    }
  }

  private updateCustomResponsePercentage(): void {
    if (this.stats.totalQueries > 0) {
      const percentage = ((this.stats.customResponses / this.stats.totalQueries) * 100).toFixed(1);
      this.stats.customResponsePercentage = `${percentage}%`;
    } else {
      this.stats.customResponsePercentage = '0%';
    }
  }

  getStats(): ChatStats {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats = {
      customResponses: 0,
      apiCalls: 0,
      totalQueries: 0,
      customResponsePercentage: '0%'
    };
  }

  // New method to get context stats for a specific user
  getUserContextStats(userId: string): { totalConversations: number; summary: string } {
    return {
      totalConversations: contextMemoryService.getTotalConversationCount(userId),
      summary: contextMemoryService.getConversationSummary(userId)
    };
  }
}

// Export singleton instance
export const chatHandler = new EnhancedChatHandler();
