const SAFE_SEGMENT_REGEX = /[^a-zA-Z0-9-_.]/g;

function sanitizeSegment(value: string): string {
  return value.replace(SAFE_SEGMENT_REGEX, '_');
}

export function buildChatMediaPath(
  userId: string,
  conversationId: string,
  fileName: string,
  prefix = 'chat_media'
): string {
  const safeUserId = sanitizeSegment(userId);
  const safeConversationId = sanitizeSegment(conversationId);
  const safeFileName = sanitizeSegment(fileName);

  return `${safeUserId}/${safeConversationId}/${prefix}/${Date.now()}-${crypto.randomUUID()}-${safeFileName}`;
}
