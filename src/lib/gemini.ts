import { toast } from "sonner";
import { Message } from "./db";
import { chatDB } from "./db";
import { supabase } from "@/integrations/supabase/client";
import { apiKeyRotationService } from "@/services/apiKeyRotationService";

export async function generateResponse(
  prompt: string, 
  history: Message[] = [], 
  chatId?: string,
  apiKeyType: 'default' | 'interactive-teacher' | 'interactive-quiz' = 'default'
): Promise<string> {
  try {
    console.log(`🚀 Using Multi-Provider API system with type:`, apiKeyType);
    
    // Log current API key rotation stats
    const stats = apiKeyRotationService.getRotationStats();
    console.log("📊 Multi-Provider API Stats:", stats);

    // Convert history to the format expected by the API service
    const formattedHistory = history.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Use the new multi-provider API request method
    const apiResponse = await apiKeyRotationService.makeApiRequest(prompt, formattedHistory, apiKeyType);

    if (!apiResponse.success) {
      console.error(`❌ All API providers failed:`, apiResponse.error);
      throw new Error(apiResponse.error || "All AI services are currently unavailable");
    }

    const responseText = apiResponse.response!;
    
    // Log success details
    console.log(`✅ Success with Multi-Provider system:`, {
      provider: apiResponse.provider,
      model: apiResponse.model,
      keyUsed: apiResponse.keyUsed,
      responseLength: responseText.length
    });

    // Show success toast with provider info
    toast.success(`Response from ${apiResponse.provider} (${apiResponse.model})`, {
      duration: 2000
    });
    
    // If chatId is provided, store the response in local storage via chatDB
    if (chatId) {
      try {
        await chatDB.addMessage(chatId, responseText, "bot");
        console.log("💾 Response stored in local storage for chat:", chatId);
      } catch (storageError) {
        console.error("❌ Error storing response in local storage:", storageError);
        // Continue even if storage fails - don't block the response
      }
    }

    return responseText;
    
  } catch (error) {
    console.error("❌ Multi-Provider API system failed:", error);
    
    // Show user-friendly error message
    const errorMessage = error.message?.includes('rate limit') 
      ? "All AI services are busy, please try again in a moment"
      : error.message?.includes('Failed to fetch')
      ? "Network connection issue, please check your internet"
      : error.message?.includes('unavailable')
      ? "AI services are temporarily unavailable"
      : "Failed to get response from AI services";
      
    toast.error(errorMessage, {
      duration: 5000,
      action: {
        label: 'Force Retry',
        onClick: () => {
          // Force rotation to try different provider
          apiKeyRotationService.forceRotation(apiKeyType);
          window.location.reload();
        }
      }
    });
    
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
  // Construct a detailed prompt for the study plan
  let prompt = '';
  
  if (language === 'en') {
    prompt = `Create a detailed day-by-day study plan for my ${examName} exam on ${examDate}. 
    I need to study these subjects: ${subjects}. I can dedicate ${dailyHours} hours daily.
    
    Please include:
    1. A specific daily schedule with EXACT topics from each subject to study each day
    2. How many minutes to spend on each topic
    3. Which chapters and sub-topics to cover on specific days
    4. When to take breaks and for how long
    5. When to do revision sessions
    
    FORMAT:
    - Organize by DAY (Day 1, Day 2, etc.)
    - For each day, list specific TASKS with:
      * Subject name
      * Chapter number and name
      * Specific topic
      * Duration in minutes
      * Priority level
      * Learning objective
    
    Make it very detailed and specific, like a teacher would prepare for their student.`;
  } else {
    prompt = `मेरी ${examName} परीक्षा के लिए ${examDate} तक एक विस्तृत दिन-प्रतिदिन अध्ययन योजना बनाएं।
    मुझे इन विषयों का अध्ययन करने की आवश्यकता है: ${subjects}। मैं दैनिक ${dailyHours} घंटे समर्पित कर सकता हूं।
    
    कृपया इन चीजों को शामिल करें:
    1. प्रत्येक दिन के लिए एक विशिष्ट कार्यक्रम जिसमें प्रत्येक विषय के सटीक टॉपिक्स का उल्लेख हो
    2. प्रत्येक टॉपिक पर कितने मिनट बिताने हैं
    3. किस दिन कौन से अध्याय और उप-विषय कवर करने हैं
    4. कब ब्रेक लेना है और कितने समय के लिए
    5. कब रिवीजन सेशन करने हैं
    
    प्रारूप:
    - दिन के अनुसार व्यवस्थित करें (दिन 1, दिन 2, आदि)
    - प्रत्येक दिन के लिए, विशिष्ट कार्यों की सूची बनाएं:
      * विषय का नाम
      * अध्याय संख्या और नाम
      * विशिष्ट टॉपिक
      * मिनटों में अवधि
      * प्राथमिकता स्तर
      * सीखने का उद्देश्य
    
    इसे बहुत विस्तृत और विशिष्ट बनाएं, जैसे कि एक शिक्षक अपने छात्र के लिए तैयार करेगा।`;
  }
  
  // Call the secure Edge Function with default API key (will use rotation)
  return await generateResponse(prompt, [], undefined, 'default');
}
