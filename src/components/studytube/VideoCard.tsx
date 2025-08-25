import React from 'react';
import { YouTubeVideo, YouTubeService } from '@/services/youtubeService';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoCardProps {
  video: YouTubeVideo;
  onClick: () => void;
  className?: string;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  onClick,
  className
}) => {
  const thumbnail = video.snippet.thumbnails.medium || video.snippet.thumbnails.default;
  const title = video.snippet.title;
  const channelTitle = video.snippet.channelTitle;
  const publishedAt = YouTubeService.formatPublishedDate(video.snippet.publishedAt);
  const viewCount = video.statistics?.viewCount;

  return (
    <Card 
      className={cn(
        "group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 overflow-hidden",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-0">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gray-100 dark:bg-gray-700 overflow-hidden">
          <img
            src={thumbnail.url}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          
          {/* Play Button Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg">
              <Play className="h-8 w-8 text-white ml-1" fill="white" />
            </div>
          </div>

          {/* Duration Badge (if available) */}
          <div className="absolute bottom-2 right-2">
            <Badge variant="secondary" className="bg-black/80 text-white text-xs px-2 py-1">
              <Play className="h-3 w-3 mr-1" />
              Video
            </Badge>
          </div>
        </div>

        {/* Video Info */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug line-clamp-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
            {title}
          </h3>

          {/* Channel & Meta */}
          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              {channelTitle}
            </p>
            
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
              {viewCount && (
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  <span>{YouTubeService.formatViews(viewCount)}</span>
                </div>
              )}
              <span>•</span>
              <span>{publishedAt}</span>
            </div>
          </div>

          {/* Description Preview */}
          {video.snippet.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
              {video.snippet.description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};