import React, { useState, useEffect, useRef } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { SearchHistory } from '@/components/studytube/SearchHistory';
import { SearchBar } from '@/components/studytube/SearchBar';
import { VideoGrid } from '@/components/studytube/VideoGrid';
import { VideoPlayer } from '@/components/studytube/VideoPlayer';
import { RelatedVideos } from '@/components/studytube/RelatedVideos';
import { YouTubeService, YouTubeVideo } from '@/services/youtubeService';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMiniPlayer } from '@/contexts/MiniPlayerContext';
import { ArrowLeft, Youtube, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import PageMeta from '@/components/seo/PageMeta';
import HighPerformanceAd from '@/components/ads/HighPerformanceAd';


const StudyTube: React.FC = () => {
  const { language } = useLanguage();
  const isHindi = language === 'hi';
  const { playVideo, minimizePlayer, state: miniState } = useMiniPlayer();
  const navigate = useNavigate();

  const isMounted = useRef(true);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [currentVideo, setCurrentVideo] = useState<YouTubeVideo | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [searchError, setSearchError] = useState(false);


  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  // Restore from mini player if returning to this page
  useEffect(() => {
    if (miniState.video && !miniState.isMinimized && !currentVideo) {
      setCurrentVideo(miniState.video);
    }
  }, [miniState.video, miniState.isMinimized]);

  const handleSearch = async (query: string, retryCount = 0) => {
    if (!query.trim()) return;
    try {
      setIsLoading(true);
      setSearchError(false);
      setShowSearchHistory(false);
      setCurrentVideo(null);
      if (retryCount === 0) setVideos([]);
      const result = await YouTubeService.searchVideos(query, 20);
      if (!isMounted.current) return;
      setVideos(result.items || []);
      setNextPageToken(result.nextPageToken);
      setSearchQuery(query);
    } catch {
      if (retryCount < 2) {
        // Auto retry after a short delay
        setTimeout(() => handleSearch(query, retryCount + 1), 1000);
        return;
      }
      setSearchError(true);
      toast.error(isHindi ? 'खोज में त्रुटि हुई, फिर से कोशिश करें' : 'Search failed, please retry');
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  };

  const handleVideoSelect = async (video: YouTubeVideo) => {
    setCurrentVideo(video);
    playVideo(video);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (!video?.id?.videoId) return;
    try {
      const related = await YouTubeService.getRelatedVideos(video.id.videoId);
      if (isMounted.current) setRelatedVideos(related || []);
    } catch {}
  };

  const handleBackToSearch = () => {
    if (currentVideo) {
      minimizePlayer();
    }
    setCurrentVideo(null);
    setRelatedVideos([]);
  };

  const loadMoreVideos = async () => {
    if (!nextPageToken || !searchQuery || isLoading) return;
    try {
      setIsLoading(true);
      const result = await YouTubeService.searchVideos(searchQuery, 20, nextPageToken);
      if (!isMounted.current) return;
      setVideos(prev => [...prev, ...(result.items || [])]);
      setNextPageToken(result.nextPageToken);
    } catch {
      toast.error(isHindi ? 'और वीडियो लोड करने में त्रुटि' : 'Failed to load more');
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  };

  return (
    <PageLayout>
      <PageMeta 
        title="StudyTube - Educational Videos for Students | StudyAI"
        description="Watch curated educational videos for exam preparation. Study with video lectures in Hindi and English. Perfect for Bihar Board, competitive exams."
        canonicalPath="/study-tube"
        keywords="Educational Videos, Study Videos, Video Lectures, Online Learning, Bihar Board Videos"
      />
      <div className="min-h-screen bg-background">
        {/* Sticky header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
          <div className="max-w-7xl mx-auto px-3 py-2.5 flex items-center gap-2.5">
            {currentVideo ? (
              <button onClick={handleBackToSearch} className="p-1.5 -ml-1 rounded-full hover:bg-muted transition-colors">
                <ArrowLeft className="h-5 w-5 text-foreground" />
              </button>
            ) : (
              <>
                <button onClick={() => navigate('/')} className="p-1.5 -ml-1 rounded-full hover:bg-muted transition-colors" title="Home">
                  <Home className="h-5 w-5 text-foreground" />
                </button>
                <div className="w-7 h-7 rounded-md bg-red-600 flex items-center justify-center flex-shrink-0">
                  <Youtube className="h-4 w-4 text-white" />
                </div>
              </>
            )}

            <div className="flex-1 min-w-0">
              <SearchBar
                onSearch={handleSearch}
                onShowHistory={() => setShowSearchHistory(!showSearchHistory)}
                placeholder={isHindi ? 'वीडियो खोजें...' : 'Search videos...'}
              />
            </div>
          </div>

          {showSearchHistory && (
            <div className="px-3 pb-3">
              <SearchHistory
                onSearchSelect={(term) => { handleSearch(term); setShowSearchHistory(false); }}
                onClose={() => setShowSearchHistory(false)}
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-3 py-3">
          {currentVideo ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <VideoPlayer video={currentVideo} />
              </div>
              <div className="lg:col-span-1">
                <RelatedVideos
                  videos={relatedVideos}
                  onVideoSelect={handleVideoSelect}
                  isLoading={false}
                />
              </div>
            </div>
          ) : (
            <>
              <VideoGrid
                videos={videos}
                onVideoSelect={handleVideoSelect}
                isLoading={isLoading}
                onLoadMore={loadMoreVideos}
                hasMore={!!nextPageToken}
                searchError={searchError}
                onRetry={() => searchQuery && handleSearch(searchQuery)}
              />
              <HighPerformanceAd />
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default StudyTube;
