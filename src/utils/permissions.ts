/**
 * Comprehensive permissions manager for WebView & PWA environments.
 * Handles: Notifications, Microphone, Camera, Storage/Downloads.
 */

export type PermissionType = 'notifications' | 'microphone' | 'camera' | 'storage';

interface PermissionResult {
  granted: boolean;
  denied: boolean;
  message: string;
}

/** Detect if running inside a WebView */
export function isWebView(): boolean {
  const ua = navigator.userAgent || '';
  return (
    /wv|WebView/i.test(ua) ||
    /; wv\)/.test(ua) ||
    (/Android/.test(ua) && /Version\/[\d.]+/.test(ua) && !/Chrome\/[\d.]+ Mobile Safari\/[\d.]+$/.test(ua)) ||
    (window as any).AndroidBridge !== undefined ||
    (window as any).webkit?.messageHandlers !== undefined
  );
}

/** Check if running on a mobile device */
export function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/** Request notification permission */
export async function requestNotificationPermission(): Promise<PermissionResult> {
  if (!('Notification' in window)) {
    return { granted: false, denied: true, message: 'Notifications इस browser में support नहीं है' };
  }

  if (Notification.permission === 'granted') {
    return { granted: true, denied: false, message: 'Notification permission पहले से है' };
  }

  if (Notification.permission === 'denied') {
    return { granted: false, denied: true, message: 'Notification permission denied है। Settings से enable करें।' };
  }

  try {
    const result = await Notification.requestPermission();
    return {
      granted: result === 'granted',
      denied: result === 'denied',
      message: result === 'granted' ? 'Notifications enabled!' : 'Notification permission denied',
    };
  } catch {
    return { granted: false, denied: true, message: 'Permission request failed' };
  }
}

/** Request microphone permission */
export async function requestMicrophonePermission(): Promise<PermissionResult> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop all tracks immediately — we only needed the permission
    stream.getTracks().forEach(t => t.stop());
    return { granted: true, denied: false, message: 'Microphone access granted!' };
  } catch (err: any) {
    const denied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
    return {
      granted: false,
      denied,
      message: denied
        ? 'Microphone permission denied है। Browser/App settings से enable करें।'
        : 'Microphone access failed: ' + (err.message || 'Unknown error'),
    };
  }
}

/** Request camera permission */
export async function requestCameraPermission(): Promise<PermissionResult> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(t => t.stop());
    return { granted: true, denied: false, message: 'Camera access granted!' };
  } catch (err: any) {
    const denied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
    return {
      granted: false,
      denied,
      message: denied
        ? 'Camera permission denied है। Browser/App settings से enable करें।'
        : 'Camera access failed: ' + (err.message || 'Unknown error'),
    };
  }
}

/** Check storage/download permission (always true on web, may need handling in WebView) */
export async function checkStoragePermission(): Promise<PermissionResult> {
  // Permissions API for persistent-storage
  if (navigator.permissions) {
    try {
      const status = await navigator.permissions.query({ name: 'persistent-storage' as PermissionName });
      if (status.state === 'granted') {
        return { granted: true, denied: false, message: 'Storage permission granted' };
      }
    } catch {
      // Not supported — fallback
    }
  }

  // Request persistent storage
  if (navigator.storage?.persist) {
    try {
      const persisted = await navigator.storage.persist();
      return {
        granted: persisted,
        denied: !persisted,
        message: persisted ? 'Storage permission granted' : 'Storage permission not granted',
      };
    } catch {
      // Fallback
    }
  }

  return { granted: true, denied: false, message: 'Storage access available' };
}

/** Request a specific permission */
export async function requestPermission(type: PermissionType): Promise<PermissionResult> {
  switch (type) {
    case 'notifications':
      return requestNotificationPermission();
    case 'microphone':
      return requestMicrophonePermission();
    case 'camera':
      return requestCameraPermission();
    case 'storage':
      return checkStoragePermission();
    default:
      return { granted: false, denied: true, message: 'Unknown permission type' };
  }
}

/** Check all permissions status */
export async function checkAllPermissions(): Promise<Record<PermissionType, PermissionResult>> {
  const [notifications, microphone, camera, storage] = await Promise.all([
    requestNotificationPermission().catch(() => ({ granted: false, denied: true, message: 'Check failed' }) as PermissionResult),
    // Don't auto-request mic/camera, just check via Permissions API
    checkPermissionStatus('microphone'),
    checkPermissionStatus('camera'),
    checkStoragePermission(),
  ]);
  return { notifications, microphone, camera, storage };
}

/** Passively check a permission without triggering a prompt */
async function checkPermissionStatus(name: string): Promise<PermissionResult> {
  if (!navigator.permissions) {
    return { granted: false, denied: false, message: 'Cannot check - Permissions API unavailable' };
  }
  try {
    const status = await navigator.permissions.query({ name: name as PermissionName });
    return {
      granted: status.state === 'granted',
      denied: status.state === 'denied',
      message: status.state === 'granted' ? `${name} granted` : status.state === 'denied' ? `${name} denied — settings से enable करें` : `${name} — permission needed`,
    };
  } catch {
    return { granted: false, denied: false, message: `${name} check not supported` };
  }
}
