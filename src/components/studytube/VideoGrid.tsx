import React from 'react';
import { VideoCard } from './VideoCard';
import { YouTubeVideo } from '@/services/youtubeService';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface VideoGridProps {
  videos: YouTubeVideo[];
  onVideoSelect: (video: YouTubeVideo) => void;
  isLoading: boolean;
  onLoadMore: () => void;
  hasMore: boolean;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  videos,
  onVideoSelect,
  isLoading,
  onLoadMore,
  hasMore
}) => {
  const { language } = useLanguage();
  const isHindi = language === 'hi';

  if (isLoading && videos.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-red-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {isHindi ? 'वीडियो लोड हो रहे हैं...' : 'Loading videos...'}
          </p>
        </div>
      </div>
    );
  }

  if (videos.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📹</span>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {isHindi ? 'कोई वीडियो नहीं मिला' : 'No videos found'}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {isHindi ? 'कुछ अलग खोजने की कोशिश करें' : 'Try searching for something else'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {videos.map((video, index) => (
          <VideoCard
            key={`${video.id.videoId || video.id.channelId}-${index}`}
            video={video}
            onClick={() => onVideoSelect(video)}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-8">
          <Button
            onClick={onLoadMore}
            disabled={isLoading}
            variant="outline"
            size="lg"
            className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {isHindi ? 'लोड हो रहा है...' : 'Loading...'}
              </>
            ) : (
              isHindi ? 'और वीडियो लोड करें' : 'Load More Videos'
            )}
          </Button>
        </div>
      )}
    </div>
  );
};