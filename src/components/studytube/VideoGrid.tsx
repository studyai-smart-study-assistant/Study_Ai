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
  showConnectionMessage?: boolean;
  isRetrying?: boolean;
  onRetry?: () => void;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  videos,
  onVideoSelect,
  isLoading,
  onLoadMore,
  hasMore,
  showConnectionMessage,
  isRetrying,
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

  if (videos.length === 0 && !isLoading) {
    return (
      <div className="text-center py-16 space-y-4">
        {showConnectionMessage ? (
          <div className="max-w-md mx-auto rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-left">
            <p className="text-sm text-amber-900">
              {isHindi
                ? 'कनेक्शन कमजोर है, हाल के नतीजे दिखाने की कोशिश हो रही है'
                : 'Connection weak, showing recent results'}
            </p>
            {isRetrying && (
              <p className="text-xs text-amber-800 mt-1">
                {isHindi ? 'दोबारा कोशिश की जा रही है…' : 'Retrying...'}
              </p>
            )}
            {onRetry && (
              <Button onClick={onRetry} variant="outline" size="sm" className="rounded-full gap-2 mt-3">
                <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
                {isHindi ? 'फिर कोशिश करें' : 'Try again'}
              </Button>
            )}
          </div>
        ) : (
          <>
            <span className="text-4xl mb-4 block">🔍</span>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {isHindi ? 'वीडियो खोजें' : 'Search for videos'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isHindi ? 'ऊपर सर्च बार में कुछ टाइप करें' : 'Type something in the search bar above'}
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showConnectionMessage && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-amber-900">
              {isHindi ? 'कनेक्शन कमजोर है, हाल के नतीजे दिखाए जा रहे हैं' : 'Connection weak, showing recent results'}
            </p>
            {isRetrying && (
              <p className="text-xs text-amber-800 mt-1">
                {isHindi ? 'दोबारा कनेक्ट करने की कोशिश…' : 'Retrying...'}
              </p>
            )}
          </div>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm" className="rounded-full gap-2 shrink-0">
              <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
              {isHindi ? 'फिर कोशिश करें' : 'Retry'}
            </Button>
          )}
        </div>
      )}
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
