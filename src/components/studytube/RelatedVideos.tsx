import React from 'react';
import { YouTubeVideo, YouTubeService } from '@/services/youtubeService';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-red-600" />
      </div>
    );
  }

  if (videos.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground px-1">
        {isHindi ? 'संबंधित वीडियो' : 'Up next'}
      </h3>
      <div className="space-y-3">
        {videos.slice(0, 10).map((video, index) => {
          const thumb = video.snippet.thumbnails.medium || video.snippet.thumbnails.default;
          return (
            <div
              key={`${video.id.videoId}-${index}`}
              className="flex gap-2.5 cursor-pointer group active:scale-[0.98] transition-transform"
              onClick={() => onVideoSelect(video)}
            >
              <div className="relative flex-shrink-0 w-[168px] aspect-video bg-muted rounded-lg overflow-hidden">
                <img src={thumb.url} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="flex-1 min-w-0 py-0.5">
                <h4 className="text-xs font-medium text-foreground line-clamp-2 leading-snug">
                  {video.snippet.title}
                </h4>
                <p className="text-[11px] text-muted-foreground mt-1 truncate">{video.snippet.channelTitle}</p>
                <p className="text-[11px] text-muted-foreground">{YouTubeService.formatPublishedDate(video.snippet.publishedAt)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
