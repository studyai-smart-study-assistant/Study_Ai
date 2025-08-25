
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Info, 
  X, 
  Lightbulb, 
  CheckCircle, 
  RefreshCw,
  Sparkles 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { remoteConfigService } from '@/services/remoteConfig';

interface NotesGuideProps {
  isVisible: boolean;
  onClose: () => void;
}

interface GuideData {
  title: string;
  steps: string[];
  tips: string[];
}

const NotesGuide: React.FC<NotesGuideProps> = ({ isVisible, onClose }) => {
  const [guideData, setGuideData] = useState<GuideData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadGuideData();
  }, []);

  const loadGuideData = async () => {
    setIsLoading(true);
    try {
      await remoteConfigService.initialize();
      const data = remoteConfigService.getNotesGuide();
      setGuideData(data);
    } catch (error) {
      console.error('Error loading guide data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshGuide = async () => {
    setIsLoading(true);
    try {
      await remoteConfigService.refreshConfig();
      const data = remoteConfigService.getNotesGuide();
      setGuideData(data);
    } catch (error) {
      console.error('Error refreshing guide:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible || !guideData) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <Card className="mb-6 border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <CardTitle className="text-lg text-blue-800 dark:text-blue-200 flex items-center gap-2">
                    {guideData.title}
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                  </CardTitle>
                  <Badge variant="secondary" className="mt-1 bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-300">
                    AI-Powered Guide
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshGuide}
                  disabled={isLoading}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-800"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Steps Section */}
            <div>
              <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                कदम-दर-कदम गाइड:
              </h4>
              <div className="space-y-2">
                {guideData.steps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg"
                  >
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {step}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Tips Section */}
            <div>
              <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                प्रो टिप्स:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-2">
                {guideData.tips.map((tip, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {tip}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Call to Action */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center pt-2 border-t border-blue-200 dark:border-blue-700"
            >
              <p className="text-xs text-blue-600 dark:text-blue-400">
                💡 इन टिप्स को फॉलो करके आप बेहतरीन नोट्स बना सकते हैं!
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default NotesGuide;
