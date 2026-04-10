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
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session) return data.session;
  } catch (error) {
    console.warn("getSession failed, attempting auth storage recovery:", error);
    clearCorruptedSupabaseAuthStorage();
  }

  try {
    const { data } = await supabase.auth.refreshSession();
    return data.session ?? null;
  } catch (error) {
    console.warn("refreshSession failed during recovery:", error);
    return null;
  }
}

