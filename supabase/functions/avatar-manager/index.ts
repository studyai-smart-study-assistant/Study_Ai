// Supabase Edge Function: avatar-manager
// Handles secure avatar upload and delete using service role
// Request body (JSON):
// { action: 'upload', user_id: string, filename: string, contentType: string, fileBase64: string }
// { action: 'delete', user_id: string, avatarUrl: string }

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type UploadBody = {
  action: 'upload';
  user_id: string;
  filename: string;
  contentType: string;
  fileBase64: string; // can be raw base64 or data URL
};

type DeleteBody = {
  action: 'delete';
  user_id: string;
  avatarUrl: string;
};

type Body = UploadBody | DeleteBody;

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabaseAdmin = createClient(supabaseUrl!, serviceRoleKey!, {
  auth: { persistSession: false },
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(status: number, data: unknown) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...corsHeaders,
    },
  });
}

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function base64ToUint8Array(base64: string) {
  try {
    const cleaned = base64.includes(',') ? base64.split(',')[1] : base64;
    const binary = atob(cleaned);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch (e) {
    throw new Error('Invalid base64 data');
  }
}

serve(async (req) => {
  try {
    // CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }
    if (req.method !== 'POST') {
      return jsonResponse(405, { error: 'Method not allowed' });
    }

    const body = (await req.json()) as Body;

    if (!body || !('action' in body)) {
      return jsonResponse(400, { error: 'Invalid request body' });
    }

    if (body.action === 'upload') {
      const { user_id, filename, contentType, fileBase64 } = body as UploadBody;
      if (!user_id || !filename || !contentType || !fileBase64) {
        return jsonResponse(400, { error: 'Missing fields for upload' });
      }

      if (!contentType.startsWith('image/')) {
        return jsonResponse(400, { error: 'Only image uploads are allowed' });
      }

      const bytes = base64ToUint8Array(fileBase64);
      const maxBytes = 5 * 1024 * 1024; // 5MB
      if (bytes.byteLength > maxBytes) {
        return jsonResponse(400, { error: 'Image must be <= 5MB' });
      }

      const cleanName = sanitizeFilename(filename);
      const objectPath = `${user_id}/${Date.now()}-${cleanName}`;
      const blob = new Blob([bytes], { type: contentType });

      const { error: uploadError } = await supabaseAdmin.storage
        .from('avatars')
        .upload(objectPath, blob, { contentType, upsert: false });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return jsonResponse(500, { error: 'Failed to upload image' });
      }

      const { data: pub } = supabaseAdmin.storage.from('avatars').getPublicUrl(objectPath);
      const publicUrl = pub.publicUrl;

      // Try update, else insert
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user_id)
        .select('id');

      if (updateError) {
        console.error('Profile update error:', updateError);
      }

      if (!updated || updated.length === 0) {
        const { error: insertError } = await supabaseAdmin
          .from('profiles')
          .insert({ user_id, avatar_url: publicUrl });
        if (insertError) {
          console.error('Profile insert error:', insertError);
          // Not fatal for returning URL, but report
        }
      }

      return jsonResponse(200, { publicUrl });
    }

    if (body.action === 'delete') {
      const { user_id, avatarUrl } = body as DeleteBody;
      if (!user_id) return jsonResponse(400, { error: 'Missing user_id' });

      let removed = false;
      if (avatarUrl) {
        const marker = '/avatars/';
        const idx = avatarUrl.indexOf(marker);
        if (idx !== -1) {
          const path = avatarUrl.substring(idx + marker.length);
          const { error: removeError } = await supabaseAdmin.storage
            .from('avatars')
            .remove([path]);
          if (removeError) {
            console.error('Remove error:', removeError);
          } else {
            removed = true;
          }
        }
      }

      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ avatar_url: null })
        .eq('user_id', user_id);

      if (updateError) {
        console.error('Profile clear error:', updateError);
        return jsonResponse(500, { error: 'Failed to update profile' });
      }

      return jsonResponse(200, { success: true, removed });
    }

    return jsonResponse(400, { error: 'Unknown action' });
  } catch (err) {
    console.error('Unhandled error:', err);
    return jsonResponse(500, { error: 'Internal server error' });
  }
});
