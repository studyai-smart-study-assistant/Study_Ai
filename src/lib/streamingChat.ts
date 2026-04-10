
import { supabase } from "@/integrations/supabase/client";
import { getRecoveredSession } from "@/lib/supabase/sessionRecovery";

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
  const resolveAccessToken = async (): Promise<string> => {
    const session = await getRecoveredSession();
    let token = session?.access_token || publishableKey;

    const expiresAtMs = session?.expires_at ? session.expires_at * 1000 : 0;
    const shouldRefresh = expiresAtMs > 0 && expiresAtMs - Date.now() < 60_000;
    if (shouldRefresh) {
      const { data: refreshedData } = await supabase.auth.refreshSession();
      token = refreshedData.session?.access_token || publishableKey;
    }

    if (!token) throw new Error("Missing API Key/Token");
    return token;
  };

  const baseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
  const requestUrl = `${baseUrl}/functions/v1/chat-completion?t=${Date.now()}`;
  let authToken = await resolveAccessToken();
  let resp = await fetch(requestUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: publishableKey,
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (resp.status === 401 || resp.status === 403) {
    const { data: refreshedData } = await supabase.auth.refreshSession();
    authToken = refreshedData.session?.access_token ?? publishableKey;
    if (!authToken) throw new Error("Missing API Key/Token");
    resp = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: publishableKey,
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
      signal,
    });
  }

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
  let currentEvent = "message";
  let dataLines: string[] = [];

  const flushEvent = () => {
    if (!dataLines.length) return;
    const payload = dataLines.join('\n').trim();
    dataLines = [];

    if (!payload) return;
    if (payload === '[DONE]') {
      callbacks.onDone();
      return 'done';
    }

    try {
      const data = JSON.parse(payload);
      switch (currentEvent) {
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
        default: {
          const content = data.choices?.[0]?.delta?.content;
          if (content) callbacks.onToken(content);
        }
      }
    } catch {
      // ignore malformed partial event payloads
    }

    currentEvent = "message";
    return null;
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    let nl: number;
    while ((nl = buf.indexOf('\n')) !== -1) {
      let line = buf.slice(0, nl);
      buf = buf.slice(nl + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);

      // SSE event terminator
      if (!line) {
        if (flushEvent() === 'done') return;
        continue;
      }

      if (line.startsWith(':')) continue;
      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7).trim();
        continue;
      }
      if (line.startsWith('data: ')) {
        dataLines.push(line.slice(6));
      }
    }
  }

  flushEvent();
  callbacks.onDone();
}
