
import { supabase } from "@/integrations/supabase/client";

export interface StreamCallbacks {
  onToken: (text: string) => void;
  onStatus: (status: string, text: string, extra?: any) => void;
  onToolsUsed: (tools: Array<{ name: string; query?: string }>) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

export async function streamChatCompletion(
  payload: {
    prompt: string;
    history: Array<{ role: string; content: string }>;
    imageBase64?: string;
    reasoningMode?: boolean;
    userContext?: string;
    mindVaultContext?: string;
    groupId?: string;
  },
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const { data: { session } } = await supabase.auth.getSession();
  const authToken = session?.access_token ?? publishableKey;

  const baseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
  
  const resp = await fetch(`${baseUrl}/functions/v1/chat-completion`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: publishableKey,
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!resp.ok) {
    const errText = await resp.text();
    let msg = `Error ${resp.status}`;
    try { msg = JSON.parse(errText)?.error || msg; } catch {}
    callbacks.onError(msg);
    return;
  }

  if (!resp.body) {
    callbacks.onError("Empty response");
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    let nl: number;
    while ((nl = buf.indexOf('\n')) !== -1) {
      let line = buf.slice(0, nl);
      buf = buf.slice(nl + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (!line || line.startsWith(':')) continue;

      // Parse event type
      if (line.startsWith('event: ')) {
        const eventType = line.slice(7).trim();
        // Read next data line
        const dataIdx = buf.indexOf('\n');
        if (dataIdx === -1) { buf = line + '\n' + buf; break; }
        let dataLine = buf.slice(0, dataIdx);
        buf = buf.slice(dataIdx + 1);
        if (dataLine.endsWith('\r')) dataLine = dataLine.slice(0, -1);
        if (!dataLine.startsWith('data: ')) continue;
        const jsonStr = dataLine.slice(6).trim();
        
        try {
          const data = JSON.parse(jsonStr);
          switch (eventType) {
            case 'token':
              if (data.content) callbacks.onToken(data.content);
              break;
            case 'status':
              callbacks.onStatus(data.status, data.text, data);
              break;
            case 'tools_used':
              callbacks.onToolsUsed(data.tools || []);
              break;
            case 'error':
              callbacks.onError(data.error || 'Unknown error');
              break;
          }
        } catch { /* partial json */ }
        continue;
      }

      // Standard SSE format (data: only)
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') { callbacks.onDone(); return; }
        try {
          const data = JSON.parse(jsonStr);
          const content = data.choices?.[0]?.delta?.content;
          if (content) callbacks.onToken(content);
        } catch {}
      }
    }
  }

  callbacks.onDone();
}
