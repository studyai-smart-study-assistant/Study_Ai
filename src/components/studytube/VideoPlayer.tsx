import React, { useState } from 'react';
import { YouTubeVideo, YouTubeService } from '@/services/youtubeService';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ExternalLink, 
  Share2, 
  Bookmark, 
  BookmarkCheck,
  Eye,
  Calendar,
  User
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
  const [showFullDescription, setShowFullDescription] = useState(false);

  const videoId = video.id.videoId;
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: video.snippet.title,
          text: `Check out this video: ${video.snippet.title}`,
          url: youtubeUrl,
        });
      } else {
        await navigator.clipboard.writeText(youtubeUrl);
        toast.success(isHindi ? 'लिंक कॉपी हो गया' : 'Link copied to clipboard');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error(isHindi ? 'शेयर करने में त्रुटि' : 'Failed to share');
    }
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast.success(
      isBookmarked 
        ? (isHindi ? 'बुकमार्क से हटाया गया' : 'Removed from bookmarks')
        : (isHindi ? 'बुकमार्क में जोड़ा गया' : 'Added to bookmarks')
    );
  };

  const truncateDescription = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="space-y-6">
      {/* Video Player */}
      <Card className="overflow-hidden border-gray-200 dark:border-gray-700">
        <CardContent className="p-0">
          <div className="relative aspect-video bg-black">
            <iframe
              src={embedUrl}
              title={video.snippet.title}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        </CardContent>
      </Card>

      {/* Video Info */}
      <Card className="border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-4">
          <div className="space-y-4">
            {/* Title */}
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
              {video.snippet.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              {video.statistics?.viewCount && (
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{YouTubeService.formatViews(video.statistics.viewCount)}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{YouTubeService.formatPublishedDate(video.snippet.publishedAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>{video.snippet.channelTitle}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBookmark}
                className="bg-white dark:bg-gray-800"
              >
                {isBookmarked ? (
                  <BookmarkCheck className="h-4 w-4 mr-2 text-green-600" />
                ) : (
                  <Bookmark className="h-4 w-4 mr-2" />
                )}
                {isBookmarked 
                  ? (isHindi ? 'सेव किया गया' : 'Saved')
                  : (isHindi ? 'सेव करें' : 'Save')
                }
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="bg-white dark:bg-gray-800"
              >
                <Share2 className="h-4 w-4 mr-2" />
                {isHindi ? 'शेयर करें' : 'Share'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                asChild
                className="bg-white dark:bg-gray-800"
              >
                <a href={youtubeUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  YouTube
                </a>
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Description */}
        {video.snippet.description && (
          <CardContent className="pt-0">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                {isHindi ? 'विवरण' : 'Description'}
              </h3>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                  {showFullDescription 
                    ? video.snippet.description
                    : truncateDescription(video.snippet.description, 300)
                  }
                </p>
                {video.snippet.description.length > 300 && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="text-red-600 hover:text-red-700 p-0 h-auto font-medium"
                  >
                    {showFullDescription 
                      ? (isHindi ? 'कम दिखाएं' : 'Show less')
                      : (isHindi ? 'और दिखाएं' : 'Show more')
                    }
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};