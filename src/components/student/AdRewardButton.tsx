import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Play, Gift, Clock, Check, AlertCircle, Shield } from 'lucide-react';
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

const REQUIRED_VIEW_TIME = 20; // 20 seconds minimum
const ADSTERRA_SCRIPT_URL = 'https://pl28383370.effectivegatecpm.com/b1/96/2b/b1962bb5db6a6e32c0fa4fa6006a7e96.js';

const AdRewardButton: React.FC<AdRewardButtonProps> = ({ userId, onCreditsEarned }) => {
  const [adStatus, setAdStatus] = useState<AdStatus | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const [adProgress, setAdProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [adState, setAdState] = useState<'idle' | 'loading' | 'showing' | 'completed' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const adContainerRef = useRef<HTMLDivElement | null>(null);
  const adStartTimeRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const adLoadedRef = useRef<boolean>(false);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (adContainerRef.current && adContainerRef.current.parentNode) {
        adContainerRef.current.parentNode.removeChild(adContainerRef.current);
      }
    };
  }, []);

  const cleanupAd = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (adContainerRef.current && adContainerRef.current.parentNode) {
      adContainerRef.current.parentNode.removeChild(adContainerRef.current);
      adContainerRef.current = null;
    }
    adStartTimeRef.current = null;
    adLoadedRef.current = false;
    setIsWatching(false);
    setAdProgress(0);
  };

  const handleCloseAdWithoutReward = () => {
    cleanupAd();
    setAdState('idle');
    toast.error('प्रचार समय से पहले बंद किया गया', {
      description: 'क्रेडिट्स पाने के लिए पूरा प्रचार देखें'
    });
  };

  const verifyAndClaimReward = async () => {
    // CRITICAL: Only claim if ad was actually loaded and displayed
    if (!adLoadedRef.current) {
      console.error('Ad was never loaded - cannot claim reward');
      toast.error('प्रचार लोड नहीं हुआ', {
        description: 'कृपया पुनः प्रयास करें'
      });
      cleanupAd();
      setAdState('error');
      setErrorMessage('प्रचार लोड नहीं हुआ');
      return;
    }

    // CRITICAL: Verify minimum view time
    if (!adStartTimeRef.current) {
      console.error('Ad start time not recorded - cannot claim reward');
      cleanupAd();
      setAdState('error');
      setErrorMessage('प्रचार समय सत्यापित नहीं हुआ');
      return;
    }

    const viewedTime = (Date.now() - adStartTimeRef.current) / 1000;
    if (viewedTime < REQUIRED_VIEW_TIME) {
      console.error(`Ad viewed for only ${viewedTime}s - minimum ${REQUIRED_VIEW_TIME}s required`);
      toast.error('प्रचार पूरा नहीं देखा', {
        description: `कम से कम ${REQUIRED_VIEW_TIME} सेकंड देखना आवश्यक है`
      });
      cleanupAd();
      setAdState('idle');
      return;
    }

    try {
      // Call backend to verify and credit - backend does its own validation
      const { data, error } = await supabase.functions.invoke('ad-reward', {
        body: { 
          userId, 
          action: 'claim',
          viewedTime: Math.floor(viewedTime),
          timestamp: Date.now()
        }
      });

      cleanupAd();

      if (error) throw error;

      if (data.success) {
        setAdState('completed');
        toast.success(`🎉 ${data.creditsEarned} क्रेडिट्स मिले!`, {
          description: `आज ${data.remainingAds} प्रचार बचे हैं`
        });

        if (onCreditsEarned) {
          onCreditsEarned(data.creditsEarned);
        }

        setAdStatus(prev => prev ? {
          ...prev,
          adsWatchedToday: data.adsWatchedToday,
          remainingAds: data.remainingAds,
          canWatchMore: data.remainingAds > 0
        } : null);

        // Reset state after showing success
        setTimeout(() => setAdState('idle'), 3000);
      } else {
        setAdState('error');
        setErrorMessage(data.error || 'क्रेडिट्स देने में त्रुटि');
        toast.error(data.error || 'क्रेडिट्स देने में त्रुटि');
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
      setAdState('error');
      setErrorMessage('सर्वर त्रुटि');
      toast.error('क्रेडिट्स देने में त्रुटि हुई');
    }
  };

  const handleWatchAd = async () => {
    if (!adStatus?.canWatchMore || isWatching) return;

    setIsWatching(true);
    setAdProgress(0);
    setAdState('loading');
    setErrorMessage(null);
    adLoadedRef.current = false;
    adStartTimeRef.current = null;

    try {
      // Create ad container overlay
      const adContainer = document.createElement('div');
      adContainer.id = 'adsterra-reward-ad';
      adContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20px;
      `;
      adContainerRef.current = adContainer;

      // Close button (only after minimum time or for early exit without reward)
      const closeButton = document.createElement('button');
      closeButton.id = 'ad-close-btn';
      closeButton.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        padding: 10px 20px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        display: none;
      `;
      closeButton.textContent = '✕ बंद करें (बिना क्रेडिट)';
      closeButton.onclick = handleCloseAdWithoutReward;

      // Loading indicator
      const loadingDiv = document.createElement('div');
      loadingDiv.id = 'ad-loading-indicator';
      loadingDiv.style.cssText = `
        color: white;
        text-align: center;
        margin-bottom: 20px;
      `;
      loadingDiv.innerHTML = `
        <div style="width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.3); border-top-color: #fbbf24; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 15px;"></div>
        <p style="font-size: 16px;">प्रचार लोड हो रहा है...</p>
        <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
      `;

      // Ad script container
      const adScriptContainer = document.createElement('div');
      adScriptContainer.id = 'ad-script-container';
      adScriptContainer.style.cssText = `
        width: 100%;
        max-width: 728px;
        min-height: 250px;
        background: #1a1a1a;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        margin-bottom: 20px;
        position: relative;
      `;

      // Progress info (hidden initially until ad loads)
      const progressInfo = document.createElement('div');
      progressInfo.id = 'ad-progress-info';
      progressInfo.style.cssText = `
        color: white;
        text-align: center;
        font-family: system-ui;
        display: none;
      `;
      progressInfo.innerHTML = `
        <p style="font-size: 18px; margin-bottom: 10px;">🎁 प्रचार देखें और 20 क्रेडिट्स कमाएं!</p>
        <p id="ad-countdown" style="font-size: 28px; font-weight: bold; color: #fbbf24;">${REQUIRED_VIEW_TIME} सेकंड शेष</p>
        <div style="width: 300px; height: 10px; background: #333; border-radius: 5px; margin: 15px auto; overflow: hidden;">
          <div id="ad-progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #fbbf24, #f59e0b); border-radius: 5px; transition: width 0.1s;"></div>
        </div>
        <p style="font-size: 12px; color: #888; margin-top: 10px;">
          <span style="color: #ef4444;">⚠️</span> समय से पहले बंद करने पर क्रेडिट नहीं मिलेगा
        </p>
      `;

      // Claim button (hidden initially)
      const claimButton = document.createElement('button');
      claimButton.id = 'ad-claim-btn';
      claimButton.style.cssText = `
        display: none;
        background: linear-gradient(90deg, #fbbf24, #f59e0b);
        border: none;
        color: #000;
        padding: 15px 40px;
        border-radius: 12px;
        font-size: 18px;
        font-weight: bold;
        cursor: pointer;
        margin-top: 20px;
        box-shadow: 0 4px 15px rgba(251, 191, 36, 0.4);
      `;
      claimButton.textContent = '🎉 20 क्रेडिट्स प्राप्त करें!';
      claimButton.onclick = verifyAndClaimReward;

      adContainer.appendChild(closeButton);
      adContainer.appendChild(loadingDiv);
      adContainer.appendChild(adScriptContainer);
      adContainer.appendChild(progressInfo);
      adContainer.appendChild(claimButton);
      document.body.appendChild(adContainer);

      // Show close button after 3 seconds
      setTimeout(() => {
        const btn = document.getElementById('ad-close-btn');
        if (btn) btn.style.display = 'block';
      }, 3000);

      // Load Adsterra script
      const adScript = document.createElement('script');
      adScript.src = ADSTERRA_SCRIPT_URL;
      adScript.async = true;
      
      // Track if script loads successfully
      adScript.onload = () => {
        console.log('Adsterra script loaded successfully');
        // Give time for ad to render
        setTimeout(() => {
          checkIfAdLoaded();
        }, 2000);
      };

      adScript.onerror = (error) => {
        console.error('Failed to load Adsterra script:', error);
        setAdState('error');
        setErrorMessage('प्रचार लोड करने में विफल (AdBlock?)');
        
        // Show error in container
        if (loadingDiv) {
          loadingDiv.innerHTML = `
            <div style="color: #ef4444; font-size: 48px; margin-bottom: 15px;">⚠️</div>
            <p style="font-size: 18px; color: #ef4444; margin-bottom: 10px;">प्रचार लोड नहीं हो सका</p>
            <p style="font-size: 14px; color: #888;">कृपया AdBlock बंद करें और पुनः प्रयास करें</p>
            <button onclick="document.getElementById('adsterra-reward-ad').remove(); window.location.reload();" 
                    style="margin-top: 20px; background: #ef4444; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;">
              बंद करें
            </button>
          `;
        }
        
        toast.error('प्रचार लोड नहीं हो सका', {
          description: 'कृपया AdBlock बंद करें'
        });
      };

      adScriptContainer.appendChild(adScript);

    } catch (error) {
      console.error('Error loading ad:', error);
      cleanupAd();
      setAdState('error');
      setErrorMessage('प्रचार लोड करने में त्रुटि');
      toast.error('प्रचार लोड करने में त्रुटि हुई');
    }
  };

  const checkIfAdLoaded = () => {
    const adContainer = document.getElementById('ad-script-container');
    
    // Check if Adsterra has injected any content
    // Adsterra typically adds iframes or divs with specific patterns
    const hasAdContent = adContainer && (
      adContainer.querySelector('iframe') ||
      adContainer.querySelector('ins') ||
      adContainer.querySelector('[id*="aswift"]') ||
      adContainer.querySelectorAll('*').length > 2 // More than just our script
    );

    const loadingIndicator = document.getElementById('ad-loading-indicator');
    const progressInfo = document.getElementById('ad-progress-info');

    if (hasAdContent) {
      console.log('Ad content detected - starting timer');
      adLoadedRef.current = true;
      setAdState('showing');
      
      // Hide loading, show progress
      if (loadingIndicator) loadingIndicator.style.display = 'none';
      if (progressInfo) progressInfo.style.display = 'block';
      
      // NOW start the timer - only after ad is confirmed loaded
      startViewTimer();
    } else {
      console.log('No ad content detected - checking again...');
      // Check again after a delay (up to 10 seconds total)
      setTimeout(() => {
        const adContainer2 = document.getElementById('ad-script-container');
        const hasAdContent2 = adContainer2 && adContainer2.querySelectorAll('*').length > 2;
        
        if (hasAdContent2) {
          console.log('Ad content detected on retry');
          adLoadedRef.current = true;
          setAdState('showing');
          
          if (loadingIndicator) loadingIndicator.style.display = 'none';
          if (progressInfo) progressInfo.style.display = 'block';
          
          startViewTimer();
        } else {
          console.error('Ad failed to load after timeout');
          setAdState('error');
          setErrorMessage('प्रचार उपलब्ध नहीं है');
          
          if (loadingIndicator) {
            loadingIndicator.innerHTML = `
              <div style="color: #f59e0b; font-size: 48px; margin-bottom: 15px;">📭</div>
              <p style="font-size: 18px; color: #f59e0b; margin-bottom: 10px;">कोई प्रचार उपलब्ध नहीं</p>
              <p style="font-size: 14px; color: #888;">कृपया बाद में पुनः प्रयास करें</p>
              <button id="ad-retry-close-btn" style="margin-top: 20px; background: #f59e0b; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;">
                बंद करें
              </button>
            `;
            
            const retryCloseBtn = document.getElementById('ad-retry-close-btn');
            if (retryCloseBtn) {
              retryCloseBtn.onclick = () => {
                cleanupAd();
                setAdState('idle');
              };
            }
          }
          
          toast.warning('कोई प्रचार उपलब्ध नहीं', {
            description: 'बाद में पुनः प्रयास करें'
          });
        }
      }, 5000);
    }
  };

  const startViewTimer = () => {
    adStartTimeRef.current = Date.now();
    let elapsed = 0;

    timerIntervalRef.current = setInterval(() => {
      elapsed += 0.1;
      const progress = Math.min((elapsed / REQUIRED_VIEW_TIME) * 100, 100);
      setAdProgress(progress);

      const countdown = document.getElementById('ad-countdown');
      const progressBar = document.getElementById('ad-progress-bar');
      const closeBtn = document.getElementById('ad-close-btn');
      const claimBtn = document.getElementById('ad-claim-btn');

      if (countdown) {
        const remaining = Math.max(0, Math.ceil(REQUIRED_VIEW_TIME - elapsed));
        countdown.textContent = remaining > 0 ? `${remaining} सेकंड शेष` : '✓ पूरा हुआ!';
        if (remaining === 0) {
          countdown.style.color = '#10b981';
        }
      }
      if (progressBar) {
        progressBar.style.width = `${progress}%`;
        if (progress >= 100) {
          progressBar.style.background = 'linear-gradient(90deg, #10b981, #059669)';
        }
      }

      if (elapsed >= REQUIRED_VIEW_TIME) {
        clearInterval(timerIntervalRef.current!);
        timerIntervalRef.current = null;

        // Show claim button, update close button
        if (claimBtn) claimBtn.style.display = 'block';
        if (closeBtn) {
          closeBtn.textContent = '✕ बाद में';
          closeBtn.style.background = 'rgba(255, 255, 255, 0.1)';
        }
      }
    }, 100);
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
                <p className="text-sm text-yellow-700 dark:text-yellow-300 flex items-center gap-1">
                  <Shield className="h-3 w-3" />
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

          {/* Error Message */}
          {adState === 'error' && errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-700 dark:text-red-300">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{errorMessage}</span>
            </div>
          )}

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
                  disabled={isWatching || adState === 'loading' || adState === 'showing'}
                  className="w-full h-14 text-lg font-bold bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 hover:from-yellow-500 hover:via-amber-600 hover:to-orange-600 text-white shadow-xl shadow-orange-500/30 border-0"
                >
                  {isWatching ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>
                        {adState === 'loading' ? 'प्रचार लोड हो रहा...' : 'प्रचार चल रहा है...'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Play className="h-6 w-6" />
                      <span>प्रचार देखें (+{adStatus?.creditsPerAd || 20} क्रेडिट्स)</span>
                    </div>
                  )}
                </Button>
                <p className="text-xs text-center text-yellow-600 dark:text-yellow-400 mt-2">
                  ⏱️ कम से कम {REQUIRED_VIEW_TIME} सेकंड देखना आवश्यक
                </p>
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
