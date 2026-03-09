/**
 * WebView-safe download utility with Capacitor Filesystem support.
 * Handles Android/iOS WebViews where standard <a download> doesn't work.
 * 
 * Strategy order:
 * 1. Capacitor Filesystem (native app — saves to Downloads folder)
 * 2. Web Share API (mobile WebView — hands off to OS)
 * 3. Blob URL + anchor click (standard web)
 * 4. Base64 data URL fallback
 * 5. External browser fallback
 */

import { isWebView, isMobile, checkStoragePermission } from './permissions';
import { toast } from 'sonner';

interface DownloadOptions {
  blob?: Blob;
  dataUrl?: string;
  url?: string;
  filename: string;
  mimeType?: string;
}

/** Convert Blob to Base64 string */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove data URL prefix to get pure base64
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
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

/** Lazy import helper so web builds don't fail when native modules aren't installed */
async function safeDynamicImport<T = any>(moduleName: string): Promise<T> {
  // Avoid static analysis by bundlers for optional native-only packages
  return new Function('m', 'return import(m)')(moduleName) as Promise<T>;
}

/** Try saving via Capacitor Filesystem (native app) */
async function tryCapacitorDownload(blob: Blob, filename: string): Promise<boolean> {
  try {
    const [{ Filesystem, Directory }, { Capacitor }] = await Promise.all([
      safeDynamicImport<{ Filesystem: any; Directory: any }>('@capacitor/filesystem'),
      safeDynamicImport<{ Capacitor: { isNativePlatform: () => boolean } }>('@capacitor/core'),
    ]);

    // Only works in native app context
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    // Check/request storage permission
    const permResult = await checkStoragePermission();
    if (!permResult.granted) {
      toast.error('📂 Storage permission दें ताकि फाइल save हो सके।');
      return false;
    }

    const base64Data = await blobToBase64(blob);

    // Save to Downloads directory
    const result = await Filesystem.writeFile({
      path: filename,
      data: base64Data,
      directory: Directory.Documents,
      recursive: true,
    });

    if (result.uri) {
      toast.success(`✅ फाइल save हो गई: ${filename}`, {
        description: 'Documents फोल्डर में देखें',
        duration: 4000,
      });
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Capacitor Filesystem not available:', err);
    return false;
  }
}

/** Try Base64 data URL download (WebView fallback) */
function tryBase64Download(blob: Blob, filename: string, mimeType?: string): boolean {
  try {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      link.target = '_blank';
      link.style.display = 'none';

      // Set proper MIME type
      if (mimeType) {
        link.setAttribute('type', mimeType);
      }

      document.body.appendChild(link);
      
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: false,
      });
      link.dispatchEvent(clickEvent);

      setTimeout(() => {
        document.body.removeChild(link);
      }, 3000);
    };
    reader.readAsDataURL(blob);
    return true;
  } catch (err) {
    console.warn('Base64 download failed:', err);
    return false;
  }
}

/** Open URL in external browser as last resort */
function openInExternalBrowser(blob: Blob, filename: string): boolean {
  try {
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_system') || window.open(url, '_blank');
    
    if (win) {
      toast.info('📥 फाइल बाहरी ब्राउज़र में खुल रही है...', {
        description: 'वहां से डाउनलोड करें',
        duration: 5000,
      });
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      return true;
    }

    // If popup blocked, show manual option
    toast.error('❌ डाउनलोड नहीं हो पाया', {
      description: 'कृपया Chrome ब्राउज़र में खोलकर try करें',
      duration: 6000,
      action: {
        label: 'Chrome में खोलें',
        onClick: () => {
          // Try intent URL for Android
          const intentUrl = `intent://${window.location.host}${window.location.pathname}#Intent;scheme=https;package=com.android.chrome;end`;
          window.location.href = intentUrl;
        },
      },
    });
    return false;
  } catch {
    return false;
  }
}

/**
 * Download a file with WebView-compatible fallbacks.
 */
export async function safeDownload(options: DownloadOptions): Promise<boolean> {
  const { filename, mimeType } = options;
  let blob: Blob;

  // Show download starting toast
  const loadingToastId = toast.loading(`📥 "${filename}" डाउनलोड हो रहा है...`);

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
      toast.dismiss(loadingToastId);
      return openInExternalBrowser(new Blob([]), filename);
    }
  } else {
    toast.dismiss(loadingToastId);
    toast.error('Download failed: No file data');
    return false;
  }

  // Strategy 1: Capacitor Filesystem (native app)
  const capacitorResult = await tryCapacitorDownload(blob, filename);
  if (capacitorResult) {
    toast.dismiss(loadingToastId);
    return true;
  }

  // Strategy 2: Web Share API (mobile WebView)
  if (isMobile() || isWebView()) {
    try {
      const file = new File([blob], filename, { type: mimeType || blob.type });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: filename, files: [file] });
        toast.dismiss(loadingToastId);
        toast.success(`✅ "${filename}" शेयर हो गया!`);
        return true;
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        toast.dismiss(loadingToastId);
        return true; // User cancelled — OK
      }
      console.warn('Share API failed, trying fallback:', err);
    }
  }

  // Strategy 3: Blob URL + anchor (standard web)
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    if (isWebView()) {
      link.target = '_blank';
    }

    document.body.appendChild(link);

    const clickEvent = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: false,
    });
    link.dispatchEvent(clickEvent);

    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 5000);

    // In WebView, blob URL might silently fail — try base64 as backup
    if (isWebView()) {
      // Give blob URL a moment, then try base64 too
      setTimeout(() => {
        tryBase64Download(blob, filename, mimeType);
      }, 1000);
    }

    toast.dismiss(loadingToastId);
    toast.success(`✅ "${filename}" डाउनलोड हो रहा है!`, { duration: 3000 });
    return true;
  } catch (err) {
    console.warn('Blob download failed:', err);
  }

  // Strategy 4: Base64 data URL download
  if (tryBase64Download(blob, filename, mimeType)) {
    toast.dismiss(loadingToastId);
    toast.success(`✅ "${filename}" डाउनलोड हो रहा है!`, { duration: 3000 });
    return true;
  }

  // Strategy 5: External browser fallback
  toast.dismiss(loadingToastId);
  return openInExternalBrowser(blob, filename);
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
