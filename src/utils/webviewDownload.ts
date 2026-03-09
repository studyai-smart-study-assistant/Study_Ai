/**
 * WebView-safe download utility.
 * Uses multiple fallback strategies for downloading files
 * inside Android/iOS WebViews where standard <a download> may not work.
 */

import { isWebView, isMobile } from './permissions';
import { toast } from 'sonner';

interface DownloadOptions {
  blob?: Blob;
  dataUrl?: string;
  url?: string;
  filename: string;
  mimeType?: string;
}

/**
 * Download a file with WebView-compatible fallbacks.
 * Strategy order:
 * 1. Web Share API (best for mobile WebView — hands off to OS)
 * 2. Blob URL + anchor click (standard web)
 * 3. window.open fallback
 */
export async function safeDownload(options: DownloadOptions): Promise<boolean> {
  const { filename, mimeType } = options;
  let blob: Blob;

  // Build blob from whatever input we have
  if (options.blob) {
    blob = options.blob;
  } else if (options.dataUrl) {
    blob = dataUrlToBlob(options.dataUrl);
  } else if (options.url) {
    try {
      const res = await fetch(options.url);
      blob = await res.blob();
    } catch {
      // If fetch fails, try direct link
      return fallbackWindowOpen(options.url, filename);
    }
  } else {
    toast.error('Download failed: No file data');
    return false;
  }

  // Strategy 1: Web Share API (works great in WebViews)
  if (isMobile() || isWebView()) {
    try {
      const file = new File([blob], filename, { type: mimeType || blob.type });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: filename, files: [file] });
        return true;
      }
    } catch (err: any) {
      // AbortError means user cancelled — that's OK
      if (err.name === 'AbortError') return true;
      console.warn('Share API failed, trying fallback:', err);
    }
  }

  // Strategy 2: Blob URL + anchor (standard)
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    // For WebView: also set target
    if (isWebView()) {
      link.target = '_blank';
    }
    
    document.body.appendChild(link);
    
    // Use a click event for better WebView compatibility
    const clickEvent = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: false,
    });
    link.dispatchEvent(clickEvent);
    
    // Cleanup after delay
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 5000);
    
    return true;
  } catch (err) {
    console.warn('Blob download failed:', err);
  }

  // Strategy 3: window.open
  try {
    const url = URL.createObjectURL(blob);
    return fallbackWindowOpen(url, filename);
  } catch {
    toast.error('Download नहीं हो पाया। कृपया browser में खोलकर try करें।');
    return false;
  }
}

/** Convert a data URL to Blob */
function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
  const bstr = atob(parts[1]);
  const u8arr = new Uint8Array(bstr.length);
  for (let i = 0; i < bstr.length; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }
  return new Blob([u8arr], { type: mime });
}

/** Fallback: open in new window */
function fallbackWindowOpen(url: string, _filename: string): boolean {
  const win = window.open(url, '_blank');
  if (!win) {
    toast.info('📥 Download popup blocked हो गया। कृपया popup allow करें।');
    return false;
  }
  return true;
}

/** Convenience: Download text as file */
export function safeDownloadText(text: string, filename: string, mimeType = 'text/plain') {
  const blob = new Blob([text], { type: mimeType });
  return safeDownload({ blob, filename, mimeType });
}

/** Convenience: Download from a base64 image */
export function safeDownloadImage(dataUrl: string, filename: string) {
  return safeDownload({ dataUrl, filename, mimeType: 'image/png' });
}
