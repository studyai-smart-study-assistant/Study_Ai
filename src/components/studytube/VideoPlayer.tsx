import React, { useState } from 'react';
import { YouTubeVideo, YouTubeService } from '@/services/youtubeService';
import { Button } from '@/components/ui/button';
import { 
  ExternalLink, Share2, Bookmark, BookmarkCheck, Eye, Calendar, User, ChevronDown, ChevronUp
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface VideoPlayerProps {
  video: YouTubeVideo;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ video }) => {
  const { language } = useLanguage();
  const isHindi = language === 'hi';
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showDesc, setShowDesc] = useState(false);

  const videoId = video.id.videoId;
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: video.snippet.title, url: youtubeUrl });
      } else {
        await navigator.clipboard.writeText(youtubeUrl);
        toast.success(isHindi ? 'लिंक कॉपी हो गया' : 'Link copied');
      }
    } catch {}
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast.success(isBookmarked ? (isHindi ? 'हटाया गया' : 'Removed') : (isHindi ? 'सेव किया' : 'Saved'));
  };

  return (
    <div className="space-y-3">
      {/* Video embed */}
      <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
        <iframe
          src={embedUrl}
          title={video.snippet.title}
          className="w-full h-full"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>

      {/* Title */}
      <h1 className="text-base md:text-lg font-semibold text-foreground leading-snug px-1">
        {video.snippet.title}
      </h1>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground px-1">
        {video.statistics?.viewCount && (
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {YouTubeService.formatViews(video.statistics.viewCount)}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {YouTubeService.formatPublishedDate(video.snippet.publishedAt)}
        </span>
        <span className="flex items-center gap-1">
          <User className="h-3.5 w-3.5" />
          {video.snippet.channelTitle}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-1 overflow-x-auto pb-1">
        <Button variant="outline" size="sm" onClick={handleBookmark} className="rounded-full text-xs h-8 gap-1.5 flex-shrink-0">
          {isBookmarked ? <BookmarkCheck className="h-3.5 w-3.5 text-green-600" /> : <Bookmark className="h-3.5 w-3.5" />}
          {isBookmarked ? (isHindi ? 'सेव्ड' : 'Saved') : (isHindi ? 'सेव' : 'Save')}
        </Button>
        <Button variant="outline" size="sm" onClick={handleShare} className="rounded-full text-xs h-8 gap-1.5 flex-shrink-0">
          <Share2 className="h-3.5 w-3.5" />
          {isHindi ? 'शेयर' : 'Share'}
        </Button>
        <Button variant="outline" size="sm" asChild className="rounded-full text-xs h-8 gap-1.5 flex-shrink-0">
          <a href={youtubeUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3.5 w-3.5" />
            YouTube
          </a>
        </Button>
      </div>

      {/* Description */}
      {video.snippet.description && (
        <div
          className="bg-muted/50 rounded-xl p-3 mx-1 cursor-pointer"
          onClick={() => setShowDesc(!showDesc)}
        >
          <p className={`text-xs text-muted-foreground leading-relaxed whitespace-pre-line ${showDesc ? '' : 'line-clamp-2'}`}>
            {video.snippet.description}
          </p>
          <div className="flex items-center gap-1 mt-1 text-xs font-medium text-foreground">
            {showDesc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {showDesc ? (isHindi ? 'कम दिखाएं' : 'Less') : (isHindi ? 'और दिखाएं' : 'More')}
          </div>
        </div>
      )}
    </div>
  );
};
