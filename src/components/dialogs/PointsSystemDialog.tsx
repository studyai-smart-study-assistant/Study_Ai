import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Coins, CreditCard, TrendingUp, TrendingDown, Sparkles, Gift, Zap } from 'lucide-react';
import { FEATURE_COSTS_DISPLAY } from '@/utils/points/featureLocking';

interface PointsSystemDialogProps {
  open: boolean;
  onAccept: () => void;
  onCancel: () => void;
}

const PointsSystemDialog: React.FC<PointsSystemDialogProps> = ({ open, onAccept, onCancel }) => {
  const earnMethods = [
    { icon: '🎯', title: 'गोल पूरा करें', points: '10-50', color: 'text-green-600' },
    { icon: '📝', title: 'टास्क पूरा करें', points: '5-20', color: 'text-blue-600' },
    { icon: '🔥', title: 'डेली स्ट्रीक बनाएं', points: '10', color: 'text-orange-600' },
    { icon: '🏆', title: 'अचीवमेंट अनलॉक करें', points: '20-100', color: 'text-purple-600' },
    { icon: '📚', title: 'क्विज़ पास करें', points: '15', color: 'text-indigo-600' },
    { icon: '👥', title: 'रेफरल करें', points: '50', color: 'text-pink-600' },
  ];

  const featureCosts = Object.entries(FEATURE_COSTS_DISPLAY).map(([key, feature]) => ({
    icon: feature.icon,
    name: feature.description,
    cost: feature.cost,
  }));

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <CreditCard className="h-6 w-6 text-emerald-500" />
            क्रेडिट्स सिस्टम - बहुत महत्वपूर्ण! 💎
          </DialogTitle>
          <DialogDescription className="text-base">
            क्रेडिट्स इस एप्लिकेशन की मुद्रा हैं। हर फीचर उपयोग करने के लिए क्रेडिट्स चाहिए।
            पॉइंट्स अलग हैं - वे लीडरबोर्ड रैंकिंग के लिए हैं।
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Why Credits Matter */}
          <Card className="border-2 border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-start gap-3">
                <Sparkles className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg mb-2">क्रेडिट्स क्यों महत्वपूर्ण हैं?</h3>
                  <p className="text-sm text-muted-foreground">
                    बिना क्रेडिट्स के, आप कोई भी AI फीचर उपयोग नहीं कर सकते। क्रेडिट्स हर बार फीचर उपयोग करने पर खर्च होते हैं।
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 pt-2 border-t">
                <Coins className="h-6 w-6 text-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg mb-2">पॉइंट्स vs क्रेडिट्स</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• <strong>क्रेडिट्स:</strong> फीचर्स उपयोग करने के लिए (खर्च होते हैं)</li>
                    <li>• <strong>पॉइंट्स:</strong> लीडरबोर्ड रैंकिंग के लिए (कभी खर्च नहीं होते)</li>
                    <li>• आप पॉइंट्स को क्रेडिट्स में बदल सकते हैं!</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Earn Points/Credits Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <h3 className="font-bold text-lg">पॉइंट्स/क्रेडिट्स कैसे कमाएं 💰</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {earnMethods.map((method, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{method.icon}</span>
                        <div>
                          <p className="font-medium text-sm">{method.title}</p>
                          <p className={`text-xs ${method.color} font-bold`}>
                            +{method.points} पॉइंट्स
                          </p>
                        </div>
                      </div>
                      <Zap className="h-4 w-4 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Spend Credits Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <h3 className="font-bold text-lg">फीचर्स की कीमत (क्रेडिट्स में) 🎯</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {featureCosts.map((feature, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow border-l-4 border-l-purple-500">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{feature.icon}</span>
                        <div>
                          <p className="font-medium text-sm">{feature.name}</p>
                          <p className="text-xs text-red-600 font-bold">
                            -{feature.cost} क्रेडिट्स/उपयोग
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Important Note */}
          <Card className="border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Gift className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-base mb-2">💡 महत्वपूर्ण नोट</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• हर फीचर उपयोग करने से पहले क्रेडिट्स काटे जाएंगे</li>
                    <li>• अगर क्रेडिट्स कम हैं, तो फीचर काम नहीं करेगा</li>
                    <li>• पॉइंट्स को क्रेडिट्स में बदल सकते हैं (1000 पॉइंट्स = 100 क्रेडिट्स)</li>
                    <li>• रेफरल करें या क्रेडिट्स खरीदें!</li>
                    <li>• पहली बार लॉगिन पर 100 मुफ्त क्रेडिट्स!</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            onClick={onAccept}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            समझ गया, आगे बढ़ें! ✨
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PointsSystemDialog;
