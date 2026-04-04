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

const MAX_RETRIES = 2;
const INITIAL_BACKOFF_MS = 600;

const StudyTube: React.FC = () => {
  const { language } = useLanguage();
  const isHindi = language === 'hi';
  const { playVideo, minimizePlayer, state: miniState } = useMiniPlayer();
  const navigate = useNavigate();

  const isMounted = useRef(true);
  const activeSearchIdRef = useRef(0);
  const activeSearchControllerRef = useRef<AbortController | null>(null);

  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [currentVideo, setCurrentVideo] = useState<YouTubeVideo | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [showConnectionMessage, setShowConnectionMessage] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      activeSearchControllerRef.current?.abort();
    };
  }, []);

  // Restore from mini player if returning to this page
  useEffect(() => {
    if (miniState.video && !miniState.isMinimized && !currentVideo) {
      setCurrentVideo(miniState.video);
    }
  }, [miniState.video, miniState.isMinimized, currentVideo]);

  const handleSearch = async (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    const requestId = Date.now();
    activeSearchIdRef.current = requestId;

    activeSearchControllerRef.current?.abort();
    const controller = new AbortController();
    activeSearchControllerRef.current = controller;

    setIsLoading(true);
    setIsRetrying(false);
    setShowConnectionMessage(false);
    setShowSearchHistory(false);
    setCurrentVideo(null);
    setSearchQuery(trimmedQuery);

    const cachedResult = YouTubeService.getCachedSearch(trimmedQuery);
    const hasCachedOrPrevious = !!cachedResult || videos.length > 0;

    if (cachedResult) {
      setVideos(cachedResult.items || []);
      setNextPageToken(cachedResult.nextPageToken);
    }

    try {
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
        if (controller.signal.aborted || activeSearchIdRef.current !== requestId) return;

        if (attempt > 0) {
          setIsRetrying(true);
        }

        try {
          const result = await YouTubeService.searchVideos(trimmedQuery, 20, undefined, controller.signal);

          if (!isMounted.current || controller.signal.aborted || activeSearchIdRef.current !== requestId) return;

          setVideos(result.items || []);
          setNextPageToken(result.nextPageToken);
          setShowConnectionMessage(false);
          setIsRetrying(false);
          YouTubeService.setCachedSearch(trimmedQuery, result);
          return;
        } catch (error) {
          if (controller.signal.aborted || activeSearchIdRef.current !== requestId) return;

          console.error('StudyTube search attempt failed:', error);

          if (attempt < MAX_RETRIES) {
            const waitMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
            await new Promise<void>((resolve) => {
              const timer = setTimeout(resolve, waitMs);
              controller.signal.addEventListener(
                'abort',
                () => {
                  clearTimeout(timer);
                  resolve();
                },
                { once: true }
              );
            });
            continue;
          }
        }
      }

      if (!isMounted.current || controller.signal.aborted || activeSearchIdRef.current !== requestId) return;

      setShowConnectionMessage(true);
      setIsRetrying(false);
      setNextPageToken(undefined);

      if (hasCachedOrPrevious) {
        toast.message(
          isHindi
            ? 'कनेक्शन कमजोर है, हाल के नतीजे दिखाए जा रहे हैं'
            : 'Connection weak, showing recent results'
        );
      } else {
        toast.error(isHindi ? 'अभी वीडियो लोड नहीं हो पा रहे हैं, फिर कोशिश करें' : 'Unable to load videos right now. Please retry.');
      }
    } finally {
      if (isMounted.current && activeSearchIdRef.current === requestId && !controller.signal.aborted) {
        setIsLoading(false);
      }
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
    } catch {
      // Keep UX smooth; related list is optional.
    }
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

      setVideos((prev) => [...prev, ...(result.items || [])]);
      setNextPageToken(result.nextPageToken);
    } catch (error) {
      console.error('Error loading more videos:', error);
      toast.error(isHindi ? 'और वीडियो लोड करने में समस्या हुई' : 'Could not load more videos now');
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
                onSearchSelect={(term) => {
                  handleSearch(term);
                  setShowSearchHistory(false);
                }}
                onClose={() => setShowSearchHistory(false)}
              />
            </div>
          )}
        </div>

        <div className="max-w-7xl mx-auto px-3 py-3">
          {currentVideo ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <VideoPlayer video={currentVideo} />
              </div>
              <div className="lg:col-span-1">
                <RelatedVideos videos={relatedVideos} onVideoSelect={handleVideoSelect} isLoading={false} />
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
                showConnectionMessage={showConnectionMessage}
                isRetrying={isRetrying}
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
