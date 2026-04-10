import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

const AUTH_STORAGE_KEY_SUFFIX = "-auth-token";

function clearCorruptedSupabaseAuthStorage() {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.startsWith("sb-") && key.endsWith(AUTH_STORAGE_KEY_SUFFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.warn("Unable to clear Supabase auth storage:", error);
  }
}

/**
 * Defensive session resolver:
 * - handles malformed/corrupted auth token in storage
 * - attempts refresh fallback
 * - never throws to caller
 */
export async function getRecoveredSession(): Promise<Session | null> {
  const readSession = async (): Promise<Session | null> => {
    const { data } = await supabase.auth.getSession();
    return data.session ?? null;
  };

  try {
    const session = await readSession();
    if (session) return session;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isLikelyParseError =
      /unexpected token|json|parse|malformed/i.test(message);

    if (isLikelyParseError) {
      console.warn("getSession parse failure, attempting auth storage recovery:", error);
      clearCorruptedSupabaseAuthStorage();
      try {
        const recoveredSession = await readSession();
        if (recoveredSession) return recoveredSession;
      } catch (retryError) {
        console.warn("getSession retry failed after storage recovery:", retryError);
      }
    } else {
      console.warn("getSession failed without parse/corruption signature:", error);
    }
  }

  try {
    const { data } = await supabase.auth.refreshSession();
    return data.session ?? null;
  } catch (error) {
    console.warn("refreshSession failed during recovery:", error);
    return null;
  }
}
