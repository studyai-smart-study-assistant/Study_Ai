
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, TrendingUp, TrendingDown, Clock, Gift, Share2, Copy } from 'lucide-react';
import { getPointsTransactions, PointsTransaction } from '@/utils/points/featureLocking';
import { generateReferralCode, getReferralCode, getTotalReferrals, REFERRAL_REWARDS } from '@/utils/points/referralSystem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { hi } from 'date-fns/locale';

interface PointsWalletProps {
  userId: string;
  currentPoints: number;
}

const PointsWallet: React.FC<PointsWalletProps> = ({ userId, currentPoints }) => {
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [referralCode, setReferralCode] = useState<string>('');
  const [totalReferrals, setTotalReferrals] = useState(0);

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId]);

  const loadData = async () => {
    const txns = getPointsTransactions(userId, 50);
    setTransactions(txns);
    
    let code = getReferralCode(userId);
    if (!code) {
      code = await generateReferralCode(userId);
    }
    setReferralCode(code || '');
    
    const referrals = getTotalReferrals(userId);
    setTotalReferrals(referrals);
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

  const getTransactionIcon = (txn: PointsTransaction) => {
    return txn.type === 'credit' ? (
      <TrendingUp className="h-5 w-5 text-green-500" />
    ) : (
      <TrendingDown className="h-5 w-5 text-red-500" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Wallet Balance Card */}
      <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-6 w-6" />
            पॉइंट्स वॉलेट
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold mb-2">{currentPoints.toLocaleString()}</div>
          <p className="text-purple-100">उपलब्ध पॉइंट्स</p>
        </CardContent>
      </Card>

      {/* Tabs for History and Referral */}
      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history">
            <Clock className="h-4 w-4 mr-2" />
            इतिहास
          </TabsTrigger>
          <TabsTrigger value="referral">
            <Gift className="h-4 w-4 mr-2" />
            रेफरल
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
                {transactions.length === 0 ? (
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
      </Tabs>
    </div>
  );
};

export default PointsWallet;
