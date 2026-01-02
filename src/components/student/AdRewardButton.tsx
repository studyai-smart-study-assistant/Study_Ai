import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Play, Gift, Clock, Check, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface AdRewardButtonProps {
  userId: string;
  onCreditsEarned?: (credits: number) => void;
}

interface AdStatus {
  adsWatchedToday: number;
  maxAdsPerDay: number;
  canWatchMore: boolean;
  creditsPerAd: number;
  remainingAds: number;
}

const AdRewardButton: React.FC<AdRewardButtonProps> = ({ userId, onCreditsEarned }) => {
  const [adStatus, setAdStatus] = useState<AdStatus | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const [adProgress, setAdProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [adCompleted, setAdCompleted] = useState(false);

  const checkAdStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ad-reward', {
        body: { userId, action: 'check' }
      });

      if (error) throw error;
      setAdStatus(data);
    } catch (error) {
      console.error('Error checking ad status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      checkAdStatus();
    }
  }, [userId, checkAdStatus]);

  const handleWatchAd = async () => {
    if (!adStatus?.canWatchMore || isWatching) return;

    setIsWatching(true);
    setAdProgress(0);
    setAdCompleted(false);

    // Load and display the Adsterra ad
    try {
      // Create ad container
      const adContainer = document.createElement('div');
      adContainer.id = 'adsterra-reward-ad';
      adContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      `;

      // Add ad script container
      const adScriptContainer = document.createElement('div');
      adScriptContainer.style.cssText = `
        width: 100%;
        max-width: 728px;
        min-height: 90px;
        background: #1a1a1a;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        margin-bottom: 20px;
      `;

      // Add Adsterra script
      const adScript = document.createElement('script');
      adScript.src = 'https://pl28383370.effectivegatecpm.com/b1/96/2b/b1962bb5db6a6e32c0fa4fa6006a7e96.js';
      adScript.async = true;
      adScriptContainer.appendChild(adScript);

      // Add progress info
      const progressInfo = document.createElement('div');
      progressInfo.style.cssText = `
        color: white;
        text-align: center;
        font-family: system-ui;
      `;
      progressInfo.innerHTML = `
        <p style="font-size: 18px; margin-bottom: 10px;">🎁 प्रचार देखें और 20 क्रेडिट्स कमाएं!</p>
        <p id="ad-countdown" style="font-size: 24px; font-weight: bold;">30 सेकंड शेष</p>
        <div style="width: 300px; height: 8px; background: #333; border-radius: 4px; margin: 10px auto;">
          <div id="ad-progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #10b981, #059669); border-radius: 4px; transition: width 0.1s;"></div>
        </div>
      `;

      adContainer.appendChild(adScriptContainer);
      adContainer.appendChild(progressInfo);
      document.body.appendChild(adContainer);

      // Simulate ad watching with countdown
      const duration = 30; // 30 seconds
      let elapsed = 0;

      const interval = setInterval(() => {
        elapsed += 0.1;
        const progress = (elapsed / duration) * 100;
        setAdProgress(progress);

        const countdown = document.getElementById('ad-countdown');
        const progressBar = document.getElementById('ad-progress-bar');

        if (countdown) {
          countdown.textContent = `${Math.max(0, Math.ceil(duration - elapsed))} सेकंड शेष`;
        }
        if (progressBar) {
          progressBar.style.width = `${progress}%`;
        }

        if (elapsed >= duration) {
          clearInterval(interval);

          // Award credits
          claimAdReward(adContainer);
        }
      }, 100);

    } catch (error) {
      console.error('Error loading ad:', error);
      setIsWatching(false);
      toast.error('प्रचार लोड करने में त्रुटि हुई');
    }
  };

  const claimAdReward = async (adContainer: HTMLElement) => {
    try {
      const { data, error } = await supabase.functions.invoke('ad-reward', {
        body: { userId, action: 'claim' }
      });

      // Remove ad container
      if (adContainer && adContainer.parentNode) {
        adContainer.parentNode.removeChild(adContainer);
      }

      if (error) throw error;

      if (data.success) {
        setAdCompleted(true);
        toast.success(`🎉 ${data.creditsEarned} क्रेडिट्स मिले!`, {
          description: `आज ${data.remainingAds} प्रचार बचे हैं`
        });

        if (onCreditsEarned) {
          onCreditsEarned(data.creditsEarned);
        }

        // Update status
        setAdStatus(prev => prev ? {
          ...prev,
          adsWatchedToday: data.adsWatchedToday,
          remainingAds: data.remainingAds,
          canWatchMore: data.remainingAds > 0
        } : null);
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
      toast.error('क्रेडिट्स देने में त्रुटि हुई');
    } finally {
      setIsWatching(false);
      setAdProgress(0);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-950/40 dark:to-amber-950/40 border-yellow-300 dark:border-yellow-700">
        <CardContent className="py-6 text-center">
          <div className="animate-pulse flex flex-col items-center gap-2">
            <div className="h-10 w-10 bg-yellow-300 dark:bg-yellow-700 rounded-full"></div>
            <div className="h-4 w-32 bg-yellow-300 dark:bg-yellow-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const dailyProgress = adStatus ? (adStatus.adsWatchedToday / adStatus.maxAdsPerDay) * 100 : 0;

  return (
    <Card className="bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-100 dark:from-yellow-950/40 dark:via-amber-950/40 dark:to-orange-950/40 border-2 border-yellow-400 dark:border-yellow-600 overflow-hidden">
      <CardContent className="py-6 relative">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-yellow-300/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-orange-300/20 rounded-full blur-xl animate-pulse delay-500"></div>
        </div>

        <div className="relative z-10 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-lg">
                <Gift className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-yellow-900 dark:text-yellow-100">
                  प्रचार देखें, क्रेडिट्स कमाएं!
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  हर प्रचार पर {adStatus?.creditsPerAd || 20} क्रेडिट्स
                </p>
              </div>
            </div>
          </div>

          {/* Daily Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-yellow-700 dark:text-yellow-300">
                आज देखे: {adStatus?.adsWatchedToday || 0}/{adStatus?.maxAdsPerDay || 20}
              </span>
              <span className="text-yellow-700 dark:text-yellow-300">
                {adStatus?.remainingAds || 0} बाकी
              </span>
            </div>
            <Progress 
              value={dailyProgress} 
              className="h-2 bg-yellow-200 dark:bg-yellow-800" 
            />
          </div>

          {/* Action Button or Status */}
          <AnimatePresence mode="wait">
            {adStatus?.canWatchMore ? (
              <motion.div
                key="watch-button"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Button
                  onClick={handleWatchAd}
                  disabled={isWatching}
                  className="w-full h-14 text-lg font-bold bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 hover:from-yellow-500 hover:via-amber-600 hover:to-orange-600 text-white shadow-xl shadow-orange-500/30 border-0"
                >
                  {isWatching ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>प्रचार चल रहा है...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Play className="h-6 w-6" />
                      <span>प्रचार देखें (+{adStatus?.creditsPerAd || 20} क्रेडिट्स)</span>
                    </div>
                  )}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="limit-reached"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl"
              >
                <div className="flex items-center justify-center gap-2 text-yellow-700 dark:text-yellow-300">
                  <Clock className="h-5 w-5" />
                  <span className="font-semibold">आज की लिमिट पूरी हुई!</span>
                </div>
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                  कल फिर से आएं और क्रेडिट्स कमाएं
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Today's Earnings */}
          {adStatus && adStatus.adsWatchedToday > 0 && (
            <div className="flex items-center justify-center gap-2 text-sm text-yellow-700 dark:text-yellow-300 bg-yellow-100/50 dark:bg-yellow-900/20 rounded-lg p-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>
                आज कमाए: {adStatus.adsWatchedToday * (adStatus.creditsPerAd || 20)} क्रेडिट्स
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdRewardButton;
