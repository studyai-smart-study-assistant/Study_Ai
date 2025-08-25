import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { SearchHistory } from '@/components/studytube/SearchHistory';
import { SearchBar } from '@/components/studytube/SearchBar';
import { VideoGrid } from '@/components/studytube/VideoGrid';
import { VideoPlayer } from '@/components/studytube/VideoPlayer';
import { RelatedVideos } from '@/components/studytube/RelatedVideos';
import { YouTubeService, YouTubeVideo } from '@/services/youtubeService';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, Youtube } from 'lucide-react';
import { toast } from 'sonner';

const StudyTube: React.FC = () => {
  const { language } = useLanguage();
  const isHindi = language === 'hi';
  
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [currentVideo, setCurrentVideo] = useState<YouTubeVideo | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();

  // Default educational content on page load
  useEffect(() => {
    handleSearch('educational videos in hindi', false);
  }, []);

  const handleSearch = async (query: string, addToHistory: boolean = true) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setShowSearchHistory(false);
    setCurrentVideo(null);
    
    try {
      const result = await YouTubeService.searchVideos(query, 20);
      setVideos(result.items);
      setNextPageToken(result.nextPageToken);
      setSearchQuery(query);
      
      if (addToHistory) {
        // SearchHistoryService is imported in SearchBar component
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error(isHindi ? 'खोज में त्रुटि हुई' : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoSelect = async (video: YouTubeVideo) => {
    setCurrentVideo(video);
    
    // Load related videos
    if (video.id.videoId) {
      try {
        const related = await YouTubeService.getRelatedVideos(video.id.videoId);
        setRelatedVideos(related);
      } catch (error) {
        console.error('Error loading related videos:', error);
      }
    }
  };

  const handleBackToSearch = () => {
    setCurrentVideo(null);
    setRelatedVideos([]);
  };

  const loadMoreVideos = async () => {
    if (!nextPageToken || !searchQuery) return;
    
    setIsLoading(true);
    try {
      const result = await YouTubeService.searchVideos(searchQuery, 20, nextPageToken);
      setVideos(prev => [...prev, ...result.items]);
      setNextPageToken(result.nextPageToken);
    } catch (error) {
      console.error('Load more error:', error);
      toast.error(isHindi ? 'और वीडियो लोड करने में त्रुटि' : 'Failed to load more videos');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-purple-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              {currentVideo && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBackToSearch}
                  className="text-purple-600 hover:text-purple-700 hover:bg-purple-100 dark:text-purple-400 dark:hover:text-purple-300"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                  <Youtube className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                  Study Tube
                </h1>
              </div>
              
              <div className="flex-1 max-w-2xl">
                <SearchBar
                  onSearch={handleSearch}
                  onShowHistory={() => setShowSearchHistory(true)}
                  placeholder={isHindi ? 'वीडियो खोजें...' : 'Search videos...'}
                />
              </div>
            </div>
            
            {/* Search History */}
            {showSearchHistory && (
              <div className="mt-4">
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
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Current Video View */}
          {currentVideo ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Video Player */}
              <div className="lg:col-span-2">
                <VideoPlayer video={currentVideo} />
              </div>
              
              {/* Related Videos */}
              <div className="lg:col-span-1">
                <RelatedVideos
                  videos={relatedVideos}
                  onVideoSelect={handleVideoSelect}
                  isLoading={false}
                />
              </div>
            </div>
          ) : (
            /* Video Search Results */
            <div className="space-y-6">
              {/* Welcome Section */}
              {!searchQuery && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Youtube className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    {isHindi ? 'Study Tube में आपका स्वागत है' : 'Welcome to Study Tube'}
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                    {isHindi 
                      ? 'यहाँ आप अपनी पढ़ाई के लिए बेहतरीन वीडियो खोज और देख सकते हैं। शुरुआत करने के लिए ऊपर सर्च बार का उपयोग करें।'
                      : 'Find and watch amazing educational videos for your studies. Use the search bar above to get started.'
                    }
                  </p>
                </div>
              )}

              {/* Video Grid */}
              <VideoGrid
                videos={videos}
                onVideoSelect={handleVideoSelect}
                isLoading={isLoading}
                onLoadMore={loadMoreVideos}
                hasMore={!!nextPageToken}
              />
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default StudyTube;