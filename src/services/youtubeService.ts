import { supabase } from '@/integrations/supabase/client';

export interface YouTubeVideo {
  id: {
    videoId?: string;
    channelId?: string;
    playlistId?: string;
  };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string; width: number; height: number };
      medium: { url: string; width: number; height: number };
      high: { url: string; width: number; height: number };
      standard?: { url: string; width: number; height: number };
      maxres?: { url: string; width: number; height: number };
    };
    channelTitle: string;
    publishedAt: string;
    channelId: string;
  };
  statistics?: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
}

export interface YouTubeSearchResponse {
  items: YouTubeVideo[];
  nextPageToken?: string;
  prevPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

export class YouTubeService {
  
  static async searchVideos(
    query: string, 
    maxResults: number = 20,
    pageToken?: string
  ): Promise<YouTubeSearchResponse> {
    try {
      const { data, error } = await supabase.functions.invoke<YouTubeSearchResponse>('youtube-search', {
        body: {
          action: 'search',
          query,
          maxResults,
          pageToken
        }
      });

      if (error) {
        throw new Error(error.message || 'YouTube proxy error');
      }

      return data;
    } catch (error) {
      console.error('Error searching videos:', error);
      throw error;
    }
  }

  static async getVideoDetails(videoId: string): Promise<YouTubeVideo | null> {
    try {
      const { data, error } = await supabase.functions.invoke<{ items: YouTubeVideo[] }>('youtube-search', {
        body: {
          action: 'videoDetails',
          videoId
        }
      });

      if (error) {
        throw new Error(error.message || 'YouTube proxy error');
      }

      return data?.items?.[0] || null;
    } catch (error) {
      console.error('Error getting video details:', error);
      return null;
    }
  }

  static async getRelatedVideos(videoId: string): Promise<YouTubeVideo[]> {
    try {
      const { data, error } = await supabase.functions.invoke<{ items: YouTubeVideo[] }>('youtube-search', {
        body: {
          action: 'relatedVideos',
          videoId
        }
      });

      if (error) {
        throw new Error(error.message || 'YouTube proxy error');
      }

      return data?.items || [];
    } catch (error) {
      console.error('Error getting related videos:', error);
      return [];
    }
  }

  static formatDuration(duration: string): string {
    // Convert ISO 8601 duration to readable format
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return '0:00';

    const hours = parseInt(match[1]?.replace('H', '') || '0');
    const minutes = parseInt(match[2]?.replace('M', '') || '0');
    const seconds = parseInt(match[3]?.replace('S', '') || '0');

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  static formatViews(views: string): string {
    const num = parseInt(views);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M views`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K views`;
    }
    return `${num} views`;
  }

  static formatPublishedDate(publishedAt: string): string {
    const date = new Date(publishedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }
}

// Search history management
export class SearchHistoryService {
  private static readonly STORAGE_KEY = 'studytube_search_history';
  private static readonly MAX_HISTORY = 50;

  static getSearchHistory(): string[] {
    try {
      const history = localStorage.getItem(this.STORAGE_KEY);
      return history ? JSON.parse(history) : [];
    } catch {
      return [];
    }
  }

  static addSearchTerm(term: string): void {
    try {
      const history = this.getSearchHistory();
      const filteredHistory = history.filter(item => item !== term);
      const newHistory = [term, ...filteredHistory].slice(0, this.MAX_HISTORY);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  }

  static removeSearchTerm(term: string): void {
    try {
      const history = this.getSearchHistory();
      const filteredHistory = history.filter(item => item !== term);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredHistory));
    } catch (error) {
      console.error('Error removing from search history:', error);
    }
  }

  static clearSearchHistory(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  }
}
