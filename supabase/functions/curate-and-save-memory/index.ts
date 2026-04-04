// supabase/functions/curate-and-save-memory/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
import { OpenAI } from "https://esm.sh/openai@4.17.4";

// Initialize OpenAI client for Gemini
const openai = new OpenAI({
  apiKey: Deno.env.get("DEEPINFRA_API_KEY"),
  baseURL: "https://api.deepinfra.com/v1/openai",
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { statement, userId } = await req.json();
    if (!statement || !userId) {
      throw new Error("Missing 'statement' or 'userId' in the request body.");
    }

    const curationPrompt = `
      You are an intelligent memory curator for an AI assistant. Your role is to determine if a piece of information from a user's conversation should be saved to their long-term "Mind Vault".

      **Important Context:** The AI already has a short-term memory that remembers the last 15-20 messages. Do NOT save information that is only relevant for the current conversation (e.g., "I feel sick today", "what is 2+2").

      Your task is to save only meaningful, long-lasting facts about the user that will help in personalizing their educational journey and building a genuine connection. This includes:
      - Core personal details (Name, City, etc.)
      - Stated goals (e.g., "I want to crack the UPSC exam.")
      - Explicitly stated strengths or weaknesses ("I am weak in Algebra.")
      - Strong preferences ("I prefer learning from video examples.")
      - Declared best friends or important relationships.

      Analyze the following statement:
      Statement: "${statement}"

      Now, provide a JSON object with the following structure. Do not add any text before or after the JSON object.

      {
        "should_save": boolean, // true if it's a meaningful, long-lasting fact.
        "importance_score": number, // On a scale of 1-10, how crucial is this for the user's permanent profile?
        "category": "personal" | "academic_goal" | "academic_strength" | "academic_weakness" | "learning_preference" | "relationship" | "other" | "transient",
        "memory_key": string, // A concise, consistent key (e.g., "User Name", "Target Exam", "Best Friend"). This is VERY important for updating information.
        "memory_value": string, // The value of the memory.
        "reasoning": string // A brief explanation for your decision.
      }
    `;

    // Call Gemini via the OpenAI-compatible endpoint
    const chatCompletion = await openai.chat.completions.create({
      model: "google/gemini-pro", // Using a strong model for this critical task
      messages: [{ role: "user", content: curationPrompt }],
      response_format: { type: "json_object" },
    });

    const decisionString = chatCompletion.choices[0].message.content ?? '{}';
    const decision = JSON.parse(decisionString);

    if (decision.should_save && decision.importance_score >= 5) {
      // Create Supabase client with auth privileges
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      // Upsert the memory. This will insert a new one or update an existing one based on the key.
      const { error } = await supabaseAdmin
        .from("user_memories")
        .upsert(
          {
            user_id: userId,
            memory_key: decision.memory_key,
            memory_value: decision.memory_value,
            importance: decision.importance_score,
            source: 'ai_curated',
            category: decision.category,
          },
          { onConflict: "user_id, memory_key" } // This is the key for upserting
        );

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      return new Response(JSON.stringify({ success: true, decision, action: "saved" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      return new Response(JSON.stringify({ success: true, decision, action: "discarded" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
