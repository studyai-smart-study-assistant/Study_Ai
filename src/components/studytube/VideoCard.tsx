import React from 'react';
import { YouTubeVideo, YouTubeService } from '@/services/youtubeService';
import { cn } from '@/lib/utils';

interface VideoCardProps {
  video: YouTubeVideo;
  onClick: () => void;
  className?: string;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, onClick, className }) => {
  const thumbnail = video.snippet.thumbnails.medium || video.snippet.thumbnails.default;
  const title = video.snippet.title;
  const channelTitle = video.snippet.channelTitle;
  const publishedAt = YouTubeService.formatPublishedDate(video.snippet.publishedAt);
  const viewCount = video.statistics?.viewCount;

  return (
    <div
      className={cn(
        "cursor-pointer group active:scale-[0.98] transition-transform duration-150",
        className
      )}
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted rounded-xl overflow-hidden">
        <img
          src={thumbnail.url}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Info - YouTube style with channel avatar placeholder */}
      <div className="flex gap-3 mt-3 px-1">
        {/* Channel avatar */}
        <div className="w-9 h-9 rounded-full bg-red-500/10 flex-shrink-0 flex items-center justify-center mt-0.5">
          <span className="text-red-600 font-bold text-xs">
            {channelTitle?.charAt(0)?.toUpperCase()}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground text-sm leading-snug line-clamp-2">
            {title}
          </h3>
          <div className="mt-1 flex flex-col">
            <span className="text-xs text-muted-foreground">{channelTitle}</span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {viewCount && (
                <>
                  <span>{YouTubeService.formatViews(viewCount)}</span>
                  <span>•</span>
                </>
              )}
              <span>{publishedAt}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
