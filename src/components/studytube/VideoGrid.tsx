import React from 'react';
import { VideoCard } from './VideoCard';
import { YouTubeVideo } from '@/services/youtubeService';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface VideoGridProps {
  videos: YouTubeVideo[];
  onVideoSelect: (video: YouTubeVideo) => void;
  isLoading: boolean;
  onLoadMore: () => void;
  hasMore: boolean;
  searchError?: boolean;
  onRetry?: () => void;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  videos,
  onVideoSelect,
  isLoading,
  onLoadMore,
  hasMore,
  searchError,
  onRetry
}) => {
  const { language } = useLanguage();
  const isHindi = language === 'hi';

  if (isLoading && videos.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Loader2 className="h-7 w-7 animate-spin text-red-600 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {isHindi ? 'वीडियो लोड हो रहे हैं...' : 'Loading videos...'}
          </p>
        </div>
      </div>
    );
  }

  if (searchError && videos.length === 0) {
    return (
      <div className="text-center py-16">
        <span className="text-4xl mb-4 block">⚠️</span>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {isHindi ? 'वीडियो लोड नहीं हो पाए' : 'Failed to load videos'}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {isHindi ? 'नेटवर्क में समस्या हो सकती है, फिर से कोशिश करें' : 'Network issue, please try again'}
        </p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm" className="rounded-full gap-2">
            <RefreshCw className="h-4 w-4" />
            {isHindi ? 'फिर से कोशिश करें' : 'Retry'}
          </Button>
        )}
      </div>
    );
  }

  if (videos.length === 0 && !isLoading) {
    return (
      <div className="text-center py-16">
        <span className="text-4xl mb-4 block">🔍</span>
        <h3 className="text-lg font-semibold text-foreground mb-1">
          {isHindi ? 'वीडियो खोजें' : 'Search for videos'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {isHindi ? 'ऊपर सर्च बार में कुछ टाइप करें' : 'Type something in the search bar above'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {videos.map((video, index) => (
          <VideoCard
            key={`${video.id.videoId || video.id.channelId}-${index}`}
            video={video}
            onClick={() => onVideoSelect(video)}
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-4 pb-8">
          <Button
            onClick={onLoadMore}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="rounded-full px-6"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {isHindi ? 'लोड हो रहा है...' : 'Loading...'}
              </>
            ) : (
              isHindi ? 'और वीडियो दिखाएं' : 'Show more'
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
