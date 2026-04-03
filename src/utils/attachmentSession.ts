import type { UploadedFile } from '@/components/ChatFooterActions';

const ATTACHMENT_SESSION_PREFIX = 'chat-attachment-session:';

interface PersistedAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  lastModified: number;
  dataUrl: string;
  type: UploadedFile['type'];
}

const getStorageKey = (sessionKey: string) => `${ATTACHMENT_SESSION_PREFIX}${sessionKey}`;

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

const dataUrlToFile = (dataUrl: string, name: string, mimeType: string, lastModified: number) => {
  const [, base64] = dataUrl.split(',');
  const binaryString = atob(base64 || '');
  const len = binaryString.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i += 1) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return new File([bytes], name, { type: mimeType, lastModified });
};

export const persistAttachmentToSession = async (sessionKey: string | undefined, uploadedFile: UploadedFile) => {
  if (!sessionKey || !uploadedFile.file) return;

  const dataUrl = await fileToDataUrl(uploadedFile.file);
  const storageKey = getStorageKey(sessionKey);
  const existing = JSON.parse(localStorage.getItem(storageKey) || '[]') as PersistedAttachment[];

  const next: PersistedAttachment[] = [
    ...existing.filter((item) => item.id !== uploadedFile.id),
    {
      id: uploadedFile.id,
      name: uploadedFile.file.name,
      mimeType: uploadedFile.file.type || 'application/octet-stream',
      size: uploadedFile.file.size,
      lastModified: uploadedFile.file.lastModified,
      dataUrl,
      type: uploadedFile.type,
    },
  ];

  localStorage.setItem(storageKey, JSON.stringify(next));
};

export const restoreAttachmentsFromSession = (sessionKey: string | undefined): UploadedFile[] => {
  if (!sessionKey) return [];

  try {
    const persisted = JSON.parse(localStorage.getItem(getStorageKey(sessionKey)) || '[]') as PersistedAttachment[];
    return persisted.map((item) => {
      const file = dataUrlToFile(item.dataUrl, item.name, item.mimeType, item.lastModified);
      return {
        id: item.id,
        file,
        type: item.type,
        preview: item.type === 'image' ? item.dataUrl : undefined,
      };
    });
  } catch (error) {
    console.error('Attachment session restore failed:', error);
    return [];
  }
};

export const removeAttachmentFromSession = (sessionKey: string | undefined, fileId: string) => {
  if (!sessionKey) return;
  const storageKey = getStorageKey(sessionKey);
  const existing = JSON.parse(localStorage.getItem(storageKey) || '[]') as PersistedAttachment[];
  const next = existing.filter((item) => item.id !== fileId);
  localStorage.setItem(storageKey, JSON.stringify(next));
};

export const clearAttachmentSession = (sessionKey: string | undefined) => {
  if (!sessionKey) return;
  localStorage.removeItem(getStorageKey(sessionKey));
};
