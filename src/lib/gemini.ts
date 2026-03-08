import { toast } from "sonner";
import { Message } from "./db";
import { chatDB } from "./db";
import { supabase } from "@/integrations/supabase/client";

// Study AI - Core Chat & AI Gateway Service
// Developed by Ajit Kumar

const geminiModel = 'google/gemini-2.5-flash'; 

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
  history: Array<{ role: string; content: string }>;
  model: string;
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

      const responseText = await response.text();
      const parsed = responseText ? JSON.parse(responseText) : {};

      if (!response.ok) {
        const message = parsed?.error || `Edge function error (${response.status})`;
        throw new Error(message);
      }

      console.log(`✅ ${CHAT_FUNCTION_NAME} success via: ${baseUrl}`);
      return parsed;
    } catch (error: any) {
      lastError = error instanceof Error ? error : new Error("Unknown edge function error");
      console.warn(`⚠️ ${CHAT_FUNCTION_NAME} failed via: ${baseUrl}`, lastError.message);
    }
  }

  throw new Error(lastError?.message || "Edge function unreachable via proxy/direct route");
};

export async function generateResponse(
  prompt: string,
  history: Message[] = [],
  chatId?: string,
  model: string = 'google/gemini-2.5-flash'
): Promise<string> {
  try {
    console.log(`🚀 Study AI: Calling AI Gateway with model:`, model);

    const sanitizeForAI = (text: string) => {
      return (text || "")
        .replace(/\[Image:\s*data:image\/[^\]]+\]/g, "[Image attached]")
        .replace(/\[image:[^\]]+\]/gi, "[Image attached]")
        .trim();
    };

    const systemContext = {
      role: "system",
      content: "You are Study AI, created by Ajit Kumar. You are a smart, friendly AI teacher for Bihar Board and competitive exam students. Respond in natural Hinglish/Hindi/English based on user preference."
    };

    const formattedHistory = [
      systemContext,
      ...history.map((msg) => ({
        role: msg.role,
        content: sanitizeForAI(msg.content),
      }))
    ];

    const data = await invokeChatCompletion({
      prompt: sanitizeForAI(prompt),
      history: formattedHistory,
      model,
    });

    if (data?.error) {
      throw new Error(data.error);
    }

    const responseText = data.response;
    if (!responseText) throw new Error("AI ने कोई जवाब नहीं दिया।");

    toast.success(`✨ Study AI: जवाब तैयार है`, { duration: 2000 });

    if (chatId) {
      await chatDB.addMessage(chatId, responseText, "bot");
    }

    return responseText;
  } catch (error: any) {
    console.error("❌ AI Request failed:", error);
    const errorMessage = error.message || "AI service से जवाब पाने में विफलता।";
    toast.error(errorMessage, { duration: 5000 });
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
