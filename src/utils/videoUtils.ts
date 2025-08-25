// Utility functions for video handling and display

export const getVideoEmbedUrl = (videoId: string, autoplay: boolean = false): string => {
  const params = new URLSearchParams({
    rel: '0', // Don't show related videos from other channels
    modestbranding: '1', // Use modest YouTube branding
    fs: '1', // Allow fullscreen
    cc_load_policy: '1', // Show captions by default
    iv_load_policy: '3', // Hide video annotations
    playsinline: '1', // Play inline on mobile
  });

  if (autoplay) {
    params.set('autoplay', '1');
  }

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
};

export const getVideoThumbnail = (videoId: string, quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres' = 'medium'): string => {
  return `https://img.youtube.com/vi/${videoId}/${quality === 'medium' ? 'mqdefault' : 'hqdefault'}.jpg`;
};

export const isValidVideoId = (videoId: string): boolean => {
  // YouTube video IDs are 11 characters long and contain alphanumeric characters, underscores, and hyphens
  const regex = /^[a-zA-Z0-9_-]{11}$/;
  return regex.test(videoId);
};

export const extractVideoIdFromUrl = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/ // Just the video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
};

export const formatVideoDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const shortenText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

export const sanitizeSearchQuery = (query: string): string => {
  // Remove excessive whitespace and special characters that might break the search
  return query
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[<>]/g, '') // Remove angle brackets for safety
    .substring(0, 100); // Limit length
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};