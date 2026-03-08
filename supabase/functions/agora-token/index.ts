import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createHmac, randomBytes } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Agora Access Token V1 Implementation (006 version)
const VERSION = "006";

const PRIVILEGES = {
  kJoinChannel: 1,
  kPublishAudioStream: 2,
  kPublishVideoStream: 3,
  kPublishDataStream: 4,
};

function pack2ByteLittleEndian(val: number): Uint8Array {
  return new Uint8Array([val & 0xff, (val >> 8) & 0xff]);
}

function pack4ByteLittleEndian(val: number): Uint8Array {
  return new Uint8Array([
    val & 0xff,
    (val >> 8) & 0xff,
    (val >> 16) & 0xff,
    (val >> 24) & 0xff,
  ]);
}

function packString(str: string): Uint8Array {
  const bytes = new TextEncoder().encode(str);
  const len = pack2ByteLittleEndian(bytes.length);
  const result = new Uint8Array(len.length + bytes.length);
  result.set(len);
  result.set(bytes, len.length);
  return result;
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const totalLen = arrays.reduce((acc, arr) => acc + arr.length, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

function hmacSha256(key: Uint8Array | string, data: Uint8Array): Uint8Array {
  const hmac = createHmac('sha256', key);
  hmac.update(data);
  return new Uint8Array(hmac.digest() as Buffer);
}

function base64Encode(data: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary);
}

function generateSalt(): number {
  const buffer = randomBytes(4);
  return buffer[0] | (buffer[1] << 8) | (buffer[2] << 16) | (buffer[3] << 24);
}

function crc32(data: Uint8Array): number {
  // Simple CRC32 implementation
  let crc = 0xffffffff;
  const table = new Uint32Array(256);
  
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  
  return crc ^ 0xffffffff;
}

function packMapUint32(map: Map<number, number>): Uint8Array {
  const parts: Uint8Array[] = [];
  parts.push(pack2ByteLittleEndian(map.size));
  for (const [key, value] of map.entries()) {
    parts.push(pack2ByteLittleEndian(key));
    parts.push(pack4ByteLittleEndian(value));
  }
  return concat(...parts);
}

function generateRtcToken(
  appId: string,
  appCertificate: string,
  channelName: string,
  uid: number,
  privilegeExpiredTs: number
): string {
  const salt = generateSalt() >>> 0;
  const ts = Math.floor(Date.now() / 1000);
  const uidStr = uid === 0 ? '' : String(uid);
  
  // Build privileges map
  const privileges = new Map<number, number>();
  privileges.set(PRIVILEGES.kJoinChannel, privilegeExpiredTs);
  privileges.set(PRIVILEGES.kPublishAudioStream, privilegeExpiredTs);
  privileges.set(PRIVILEGES.kPublishVideoStream, privilegeExpiredTs);
  privileges.set(PRIVILEGES.kPublishDataStream, privilegeExpiredTs);
  
  // Build message
  const message = concat(
    pack4ByteLittleEndian(salt),
    pack4ByteLittleEndian(ts),
    pack4ByteLittleEndian(privilegeExpiredTs),
    packMapUint32(privileges)
  );
  
  // Build sign content
  const signContent = concat(
    packString(appId),
    packString(channelName),
    packString(uidStr),
    message
  );
  
  // Calculate signature
  const signature = hmacSha256(appCertificate, signContent);
  
  // Calculate CRCs
  const crcChannelName = crc32(new TextEncoder().encode(channelName));
  const crcUid = crc32(new TextEncoder().encode(uidStr));
  
  // Build token content
  const content = concat(
    packString(String.fromCharCode(...signature)),
    pack4ByteLittleEndian(crcChannelName >>> 0),
    pack4ByteLittleEndian(crcUid >>> 0),
    message
  );
  
  return VERSION + appId + base64Encode(content);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const AGORA_APP_ID = Deno.env.get('AGORA_APP_ID');
    const AGORA_APP_CERTIFICATE = Deno.env.get('AGORA_APP_CERTIFICATE');

    if (!AGORA_APP_ID) throw new Error('AGORA_APP_ID not configured');

    const { channelName, uid } = await req.json();
    if (!channelName) throw new Error('channelName is required');

    let token = null;
    
    if (AGORA_APP_CERTIFICATE && AGORA_APP_CERTIFICATE.length >= 32) {
      try {
        const expireTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour
        token = generateRtcToken(
          AGORA_APP_ID,
          AGORA_APP_CERTIFICATE,
          channelName,
          uid || 0,
          expireTime
        );
        console.log('✅ Generated Agora RTC token for channel:', channelName, 'token length:', token?.length);
      } catch (err) {
        console.error('Token generation error:', err);
        token = null;
      }
    } else {
      console.log('⚠️ No App Certificate configured, returning null token');
    }

    return new Response(
      JSON.stringify({
        appId: AGORA_APP_ID,
        channelName,
        uid: uid || 0,
        token,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Agora token error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
