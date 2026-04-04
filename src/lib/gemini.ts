import { toast } from "sonner";
import { Message } from "./db";
import { chatDB } from "./db";
import { supabase } from "@/integrations/supabase/client";
import { getRealtimeContext, isDateTimeQuery, getDateTimeAnswer } from '../utils/realtimeContext';

// Study AI - Core Chat & AI Gateway Service
// Developed by Ajit Kumar

const CHAT_FUNCTION_NAME = "chat-completion";

const getFunctionBaseUrls = () => {
  const configuredUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
  const directUrl = import.meta.env.VITE_SUPABASE_PROJECT_ID
    ? `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co`
    : "";
  return Array.from(new Set([configuredUrl, directUrl])).filter(Boolean);
};

const invokeChatCompletion = async (payload: {
  prompt: string;
  history: Array<{ role: string; content: string | any[] }>;
  model: string;
  forceWebSearch?: boolean;
  webSearchContext?: string | null;
  webSearchSources?: Array<{ title: string; url: string }>;
  imageBase64?: string;
  userId?: string;
  reasoningMode?: boolean;
}) => {
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const { data: { session } } = await supabase.auth.getSession();
  const authToken = session?.access_token ?? publishableKey;

  let lastError: Error | null = null;

  for (const baseUrl of getFunctionBaseUrls()) {
    try {
      const response = await fetch(`${baseUrl}/functions/v1/${CHAT_FUNCTION_NAME}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: publishableKey,
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = `Edge function error (${response.status})`;
        try {
          const parsed = JSON.parse(errorText);
          errorMsg = parsed?.error || errorMsg;
        } catch { errorMsg = errorText || errorMsg; }
        throw new Error(errorMsg);
      }

      const contentType = response.headers.get('content-type') || '';

      // Handle SSE streaming response
      if (contentType.includes('text/event-stream') && response.body) {
        console.log(`✅ ${CHAT_FUNCTION_NAME} streaming via: ${baseUrl}`);
        const fullText = await parseSSEStream(response.body);
        return { response: fullText, sources: [], webSearchUsed: false };
      }

      // Handle JSON response (fallback)
      const responseText = await response.text();
      const parsed = responseText ? JSON.parse(responseText) : {};
      console.log(`✅ ${CHAT_FUNCTION_NAME} success via: ${baseUrl}`);
      return parsed;
    } catch (error: any) {
      lastError = error instanceof Error ? error : new Error("Unknown edge function error");
      console.warn(`⚠️ ${CHAT_FUNCTION_NAME} failed via: ${baseUrl}`, lastError.message);
    }
  }

  throw new Error(lastError?.message || "Edge function unreachable");
};

// Parse SSE stream into complete text
async function parseSSEStream(body: ReadableStream<Uint8Array>): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let result = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIdx: number;
    while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
      let line = buffer.slice(0, newlineIdx);
      buffer = buffer.slice(newlineIdx + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (!line.startsWith('data: ')) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === '[DONE]') return result;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) result += content;
      } catch { /* partial JSON, ignore */ }
    }
  }
  return result;
}


export async function sendPushNotificationTool(params: {
  user_id: string;
  title: string;
  message: string;
  scheduled_time?: string;
  recurrence?: 'once' | 'daily' | 'weekly' | 'monthly';
  schedule_count?: number;
}): Promise<void> {
  const { error } = await supabase.functions.invoke('send-push-notification', {
    body: params,
  });

  if (error) {
    throw new Error(error.message || 'Push notification भेजने में समस्या हुई।');
  }
}

export interface WebSearchSource {
  title: string;
  url: string;
}

export interface GenerateResponseWithSearchResult {
  text: string;
  sources: WebSearchSource[];
  webSearchUsed: boolean;
  toolUsed?: string | null;
  imageUrl?: string | null;
  thinking?: string | null;
}

async function performWebSearch(query: string): Promise<{
  searchContext: string | null;
  sources: WebSearchSource[];
}> {
  try {
    const { data, error } = await supabase.functions.invoke('web-search', {
      body: { query, forceSearch: true }
    });

    if (error) {
      console.warn('⚠️ Web search failed:', error);
      return { searchContext: null, sources: [] };
    }

    return {
      searchContext: data?.searchContext || null,
      sources: data?.sources || [],
    };
  } catch (err) {
    console.warn('⚠️ Web search error:', err);
    return { searchContext: null, sources: [] };
  }
}

export async function generateResponse(
  prompt: string,
  history: Message[] = [],
  chatId?: string,
  model: string = 'google/gemini-3-flash-preview'
): Promise<string> {
const result = await generateResponseWithSearch(prompt, history, chatId, model, false);
  return result.text;
}

export async function generateResponseWithSearch(
  prompt: string,
  history: Message[] = [],
  chatId?: string,
  model: string = 'google/gemini-3-flash-preview',
  forceWebSearch: boolean = false,
  imageBase64?: string,
  reasoningMode: boolean = false
): Promise<GenerateResponseWithSearchResult> {
  try {
    console.log(`🚀 Study AI: model=${model}, forceWebSearch=${forceWebSearch}`);
    
    if (!imageBase64 && !forceWebSearch && isDateTimeQuery(prompt)) {
      const answer = getDateTimeAnswer(prompt);
      if (chatId) {
        await chatDB.addMessage(chatId, answer, "bot");
      }
      return { text: answer, sources: [], webSearchUsed: false };
    }

    const sanitizeForAI = (text: string) =>
      (text || "")
        .replace(/\[Image:\s*data:image\/[^\]]+\]/g, "[Image attached]")
        .replace(/\[image:[^\]]+\]/gi, "[Image attached]")
        .trim();

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    let mindVaultContext = '';
    if (userId) {
      try {
        const { data: memories, error } = await supabase
          .from('user_memories')
          .select('memory_key, memory_value')
          .eq('user_id', userId)
          .order('importance', { ascending: false })
          .limit(15);

        if (error) {
          console.warn("Mind Vault fetch error:", error);
        } else if (memories && memories.length > 0) {
          const memoryStrings = memories.map(m => `- ${m.memory_key}: ${m.memory_value}`);
          mindVaultContext = `\n\n🧠 Remember these facts about the user from their Mind Vault:\n${memoryStrings.join('\n')}`;
        }
      } catch (e) {
        console.error("Mind Vault exception:", e);
      }
    }
    
    const realtimeCtx = getRealtimeContext();

    const formattedHistory = [
      {
        role: "system",
        content: `You are Study AI, created by Ajit Kumar. Smart, friendly AI teacher for Bihar Board and competitive exam students.\n\n${realtimeCtx.contextPrompt}${mindVaultContext}`
      },
      ...history.slice(-30).map((msg) => ({
        role: msg.role,
        content: sanitizeForAI(msg.content),
      }))
    ];

    let webSearchContext: string | null = null;
    let webSearchSources: WebSearchSource[] = [];

    if (forceWebSearch) {
      toast.info('🔍 वेब से जानकारी खोज रहा हूँ...', { duration: 2000 });
      const searchResult = await performWebSearch(prompt);
      webSearchContext = searchResult.searchContext;
      webSearchSources = searchResult.sources;
    }

    if (reasoningMode) {
      toast.info('📐 Reasoning mode ON...', { duration: 2000 });
    }

    const data = await invokeChatCompletion({
      prompt: sanitizeForAI(prompt),
      history: formattedHistory,
      model,
      forceWebSearch,
      webSearchContext,
      webSearchSources,
      imageBase64,
      userId,
      reasoningMode,
    });

    if (data?.error) throw new Error(data.error);

    const responseText = data.response;
    if (!responseText) throw new Error("AI ने कोई जवाब नहीं दिया।");

    const sources = data.sources || webSearchSources;
    const webSearchUsed = data.webSearchUsed || false;
    const toolUsed = data.toolUsed || null;
    const imageUrl = data.imageUrl || null;
    const thinking = data.thinking || null;

    if (toolUsed === 'generate_image') {
      toast.success(`🎨 Image बन गई!`, { duration: 2000 });
    } else if (toolUsed === 'generate_notes') {
      toast.success(`📝 Notes तैयार हैं!`, { duration: 2000 });
    } else if (toolUsed === 'generate_quiz') {
      toast.success(`🎯 Quiz तैयार है!`, { duration: 2000 });
    } else if (toolUsed === 'send_push_notification') {
      toast.success(`🔔 Reminder set हो गया!`, { duration: 2000 });
    } else if (webSearchUsed) {
      toast.success(`🌐 वेब सर्च के साथ जवाब तैयार है`, { duration: 2000 });
    } else {
      toast.success(`✨ Study AI: जवाब तैयार है`, { duration: 2000 });
    }

    let finalResponseText = responseText;
    if (thinking && toolUsed) {
      finalResponseText = `[THINKING:${thinking}]${finalResponseText}`;
    }
    if (imageUrl) {
      finalResponseText = `[IMG_DATA:${imageUrl}]${finalResponseText}`;
    }

    if (chatId) {
      await chatDB.addMessage(chatId, finalResponseText, "bot");
    }

    return { text: finalResponseText, sources, webSearchUsed, toolUsed, imageUrl, thinking };
  } catch (error: any) {
    console.error("❌ AI Request failed:", error);
    toast.error(error.message || "AI service से जवाब पाने में विफलता।", { duration: 5000 });
    throw error;
  }
}

export async function generateStudyPlan(
  examName: string,
  examDate: string,
  subjects: string,
  dailyHours: string,
  language: string
): Promise<string> {
  const isBiharBoard = examName.toLowerCase().includes('bihar') || examName.toLowerCase().includes('bseb');
  
  let prompt = '';
  if (language === 'en') {
    prompt = `As my Study AI Teacher (created by Ajit Kumar), create a rigorous day-by-day study plan for ${examName} on ${examDate}. Subjects: ${subjects}. Daily dedication: ${dailyHours} hours. ${isBiharBoard ? "Note: This is for Bihar Board, focus on 50% MCQs and no negative marking strategy." : ""}`;
  } else {
    prompt = `Study AI टीचर (अजीत कुमार द्वारा विकसित) के रूप में, मेरी ${examName} परीक्षा (${examDate}) के लिए एक विस्तृत स्टडी प्लान तैयार करें। विषय: ${subjects}। समय: रोजाना ${dailyHours} घंटे। ${isBiharBoard ? "ध्यान दें: यह बिहार बोर्ड के लिए है, 50% ऑब्जेक्टिव पैटर्न और नो नेगेटिव मार्किंग के हिसाब से रणनीति बनाएं।" : ""}`;
  }

  return await generateResponse(prompt, [], undefined, 'google/gemini-3.1-pro-preview');
}
