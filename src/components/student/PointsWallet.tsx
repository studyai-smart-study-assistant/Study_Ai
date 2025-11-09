
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, TrendingUp, TrendingDown, Clock, Gift, Share2, Copy, ArrowRightLeft, Coins, CreditCard } from 'lucide-react';
import { fetchUserTransactions, DisplayTransaction } from '@/utils/points/transactions';
import { generateReferralCode, getReferralCode, getTotalReferrals, REFERRAL_REWARDS } from '@/utils/points/referralSystem';
import { convertPointsToCredits } from '@/utils/points/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { hi } from 'date-fns/locale';

interface PointsWalletProps {
  userId: string;
  currentPoints: number;
  currentCredits: number;
  onRefresh?: () => void;
}

const PointsWallet: React.FC<PointsWalletProps> = ({ userId, currentPoints, currentCredits, onRefresh }) => {
  const [transactions, setTransactions] = useState<DisplayTransaction[]>([]);
  const [referralCode, setReferralCode] = useState<string>('');
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [convertAmount, setConvertAmount] = useState('1000');
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId]);

  const loadData = async () => {
    setIsLoading(true);
    const txns = await fetchUserTransactions(userId, 50);
    setTransactions(txns);
    
    let code = getReferralCode(userId);
    if (!code) {
      code = await generateReferralCode(userId);
    }
    setReferralCode(code || '');
    
    const referrals = getTotalReferrals(userId);
    setTotalReferrals(referrals);
    setIsLoading(false);
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success('रेफरल कोड कॉपी किया!');
  };

  const shareReferral = () => {
    const message = `Study AI में मेरे साथ जुड़ें और ${REFERRAL_REWARDS.REFERRED} मुफ्त पॉइंट्स पाएं! रेफरल कोड: ${referralCode}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Study AI रेफरल',
        text: message,
      }).catch(() => {
        navigator.clipboard.writeText(message);
        toast.success('रेफरल संदेश कॉपी किया!');
      });
    } else {
      navigator.clipboard.writeText(message);
      toast.success('रेफरल संदेश कॉपी किया!');
    }
  };

  const handleConvertPoints = async () => {
    const points = parseInt(convertAmount);
    if (isNaN(points) || points < 1000) {
      toast.error('कम से कम 1000 पॉइंट्स डालें!');
      return;
    }

    if (points > currentPoints) {
      toast.error('आपके पास पर्याप्त पॉइंट्स नहीं हैं!');
      return;
    }

    setIsConverting(true);
    const success = await convertPointsToCredits(userId, points);
    setIsConverting(false);

    if (success) {
      setConvertAmount('1000');
      // Refresh data
      if (onRefresh) {
        onRefresh();
      }
      loadData();
    }
  };

  const getTransactionIcon = (txn: DisplayTransaction) => {
    return txn.type === 'credit' ? (
      <TrendingUp className="h-5 w-5 text-green-500" />
    ) : (
      <TrendingDown className="h-5 w-5 text-red-500" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Credits Card - More Prominent */}
        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-6 w-6" />
              क्रेडिट्स
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold mb-2">{currentCredits.toLocaleString()}</div>
            <p className="text-emerald-100">फीचर्स के लिए उपयोग करें</p>
          </CardContent>
        </Card>

        {/* Points Card */}
        <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-6 w-6" />
              पॉइंट्स
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-2">{currentPoints.toLocaleString()}</div>
            <p className="text-purple-100">लीडरबोर्ड रैंकिंग</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for History, Referral, Convert, and Store */}
      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="history">
            <Clock className="h-4 w-4 mr-2" />
            इतिहास
          </TabsTrigger>
          <TabsTrigger value="referral">
            <Gift className="h-4 w-4 mr-2" />
            रेफरल
          </TabsTrigger>
          <TabsTrigger value="convert">
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            कन्वर्ट
          </TabsTrigger>
          <TabsTrigger value="store">
            <Wallet className="h-4 w-4 mr-2" />
            स्टोर
          </TabsTrigger>
        </TabsList>

        {/* Transaction History */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">पॉइंट्स इतिहास</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-2">लोड हो रहा है...</p>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    अभी तक कोई लेन-देन नहीं
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((txn, index) => (
                      <div
                        key={index}
                        className="flex items-start justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex gap-3 flex-1">
                          <div className="mt-1">{getTransactionIcon(txn)}</div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{txn.description}</p>
                            {txn.feature && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {txn.feature}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(txn.timestamp), {
                                addSuffix: true,
                                locale: hi
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-bold ${
                              txn.type === 'credit' ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {txn.type === 'credit' ? '+' : '-'}
                            {txn.amount}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            शेष: {txn.balanceAfter}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Referral System */}
        <TabsContent value="referral">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">दोस्तों को आमंत्रित करें</CardTitle>
              <p className="text-sm text-muted-foreground">
                प्रत्येक रेफरल पर {REFERRAL_REWARDS.REFERRER} पॉइंट्स कमाएं!
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Referral Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                      {totalReferrals}
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-500">कुल रेफरल</p>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                      {totalReferrals * REFERRAL_REWARDS.REFERRER}
                    </div>
                    <p className="text-sm text-purple-600 dark:text-purple-500">कमाए गए</p>
                  </CardContent>
                </Card>
              </div>

              {/* Referral Code */}
              <div className="space-y-2">
                <label className="text-sm font-medium">आपका रेफरल कोड</label>
                <div className="flex gap-2">
                  <Input
                    value={referralCode}
                    readOnly
                    className="font-mono text-lg"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyReferralCode}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Share Button */}
              <Button
                onClick={shareReferral}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-600"
              >
                <Share2 className="h-4 w-4 mr-2" />
                दोस्तों के साथ शेयर करें
              </Button>

              {/* How it works */}
              <Card className="bg-muted/50">
                <CardContent className="pt-4 space-y-2">
                  <h4 className="font-semibold text-sm">कैसे काम करता है?</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• अपना रेफरल कोड दोस्तों के साथ शेयर करें</li>
                    <li>• जब वे साइन अप करें और आपका कोड दर्ज करें</li>
                    <li>• आपको {REFERRAL_REWARDS.REFERRER} पॉइंट्स मिलेंगे</li>
                    <li>• उन्हें {REFERRAL_REWARDS.REFERRED} पॉइंट्स मिलेंगे</li>
                  </ul>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Convert Tab */}
        <TabsContent value="convert">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">पॉइंट्स को क्रेडिट्स में बदलें</CardTitle>
              <p className="text-sm text-muted-foreground">
                1000 पॉइंट्स = 100 क्रेडिट्स
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">कितने पॉइंट्स कन्वर्ट करें?</label>
                <Input
                  type="number"
                  value={convertAmount}
                  onChange={(e) => setConvertAmount(e.target.value)}
                  placeholder="1000"
                  min="1000"
                  step="1000"
                />
                <p className="text-xs text-muted-foreground">
                  आपको मिलेंगे: {Math.floor(parseInt(convertAmount || '0') / 10)} क्रेडिट्स
                </p>
              </div>
              <Button
                onClick={handleConvertPoints}
                disabled={isConverting || parseInt(convertAmount) < 1000}
                className="w-full bg-gradient-to-r from-purple-500 to-emerald-600"
              >
                {isConverting ? 'कन्वर्ट हो रहा है...' : 'कन्वर्ट करें'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Store Tab */}
        <TabsContent value="store">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">क्रेडिट्स स्टोर</CardTitle>
              <p className="text-sm text-muted-foreground">
                क्रेडिट्स खरीदें और फीचर्स का उपयोग करें
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Credits Packages */}
              <div className="space-y-3">
                {[
                  { credits: 90, price: '₹9', bonus: 0 },
                  { credits: 490, price: '₹49', bonus: 10 },
                  { credits: 990, price: '₹99', bonus: 100 },
                  { credits: 2490, price: '₹249', bonus: 500 },
                ].map((pkg) => (
                  <Card 
                    key={pkg.credits}
                    className="border-2 border-dashed border-muted hover:border-primary/50 transition-colors opacity-60"
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-baseline gap-2">
                            <h3 className="text-2xl font-bold text-emerald-600">
                              {pkg.credits.toLocaleString()}
                            </h3>
                            <span className="text-sm text-muted-foreground">क्रेडिट्स</span>
                          </div>
                          {pkg.bonus > 0 && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                              + {pkg.bonus} बोनस क्रेडिट्स
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{pkg.price}</p>
                          <Button 
                            disabled 
                            className="mt-2"
                            variant="outline"
                          >
                            जल्द आ रहा है
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Payment Gateway Info */}
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                      <Wallet className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-100">
                        पेमेंट गेटवे सेटअप हो रहा है
                      </h4>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                        हम एक सुरक्षित पेमेंट सिस्टम की व्यवस्था कर रहे हैं। बहुत जल्द आप क्रेडिट्स खरीद सकेंगे।
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3 space-y-2">
                    <h5 className="text-xs font-semibold text-amber-900 dark:text-amber-100">
                      Beta अवधि के दौरान:
                    </h5>
                    <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                      <li>• पहली बार लॉगिन: 100 मुफ्त क्रेडिट्स + 1000 पॉइंट्स</li>
                      <li>• दोस्तों को रेफर करें और पॉइंट्स कमाएं</li>
                      <li>• पॉइंट्स को क्रेडिट्स में बदलें (10:1 ratio)</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Beta Notice */}
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <p className="text-xs text-center text-muted-foreground">
                    🎉 <strong>Beta उपयोगकर्ता विशेष:</strong> अभी सभी फीचर्स के लिए 
                    अतिरिक्त मुफ्त क्रेडिट्स मिल रहे हैं। इस अवसर का लाभ उठाएं!
                  </p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PointsWallet;
