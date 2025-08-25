import React from 'react';
import { YouTubeVideo, YouTubeService } from '@/services/youtubeService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Play } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface RelatedVideosProps {
  videos: YouTubeVideo[];
  onVideoSelect: (video: YouTubeVideo) => void;
  isLoading: boolean;
}

export const RelatedVideos: React.FC<RelatedVideosProps> = ({
  videos,
  onVideoSelect,
  isLoading
}) => {
  const { language } = useLanguage();
  const isHindi = language === 'hi';

  return (
    <Card className="h-fit border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
          {isHindi ? 'संबंधित वीडियो' : 'Related Videos'}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin text-red-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isHindi ? 'लोड हो रहा है...' : 'Loading...'}
              </p>
            </div>
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isHindi ? 'कोई संबंधित वीडियो नहीं मिला' : 'No related videos found'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {videos.slice(0, 10).map((video, index) => (
              <RelatedVideoCard
                key={`${video.id.videoId}-${index}`}
                video={video}
                onClick={() => onVideoSelect(video)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface RelatedVideoCardProps {
  video: YouTubeVideo;
  onClick: () => void;
}

const RelatedVideoCard: React.FC<RelatedVideoCardProps> = ({ video, onClick }) => {
  const thumbnail = video.snippet.thumbnails.medium || video.snippet.thumbnails.default;
  const title = video.snippet.title;
  const channelTitle = video.snippet.channelTitle;
  const publishedAt = YouTubeService.formatPublishedDate(video.snippet.publishedAt);

  return (
    <div 
      className={cn(
        "flex gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200",
        "hover:bg-gray-50 dark:hover:bg-gray-800 group"
      )}
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative flex-shrink-0 w-40 aspect-video bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden">
        <img
          src={thumbnail.url}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Play className="h-4 w-4 text-white ml-0.5" fill="white" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        <h4 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
          {title}
        </h4>
        
        <div className="space-y-1">
          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
            {channelTitle}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {publishedAt}
          </p>
        </div>
      </div>
    </div>
  );
};