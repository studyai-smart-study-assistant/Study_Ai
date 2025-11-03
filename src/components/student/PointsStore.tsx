import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Lock, CheckCircle, Sparkles, Crown, Palette, Award } from 'lucide-react';
import { toast } from 'sonner';

interface StoreItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: React.ReactNode;
  category: 'badge' | 'theme' | 'avatar' | 'boost';
  unlocked?: boolean;
}

interface PointsStoreProps {
  userId: string;
  currentPoints: number;
  onPurchase: (itemId: string, cost: number) => void;
}

const PointsStore: React.FC<PointsStoreProps> = ({ userId, currentPoints, onPurchase }) => {
  const [unlockedItems, setUnlockedItems] = useState<Set<string>>(new Set());

  const storeItems: StoreItem[] = [
    {
      id: 'badge_star',
      name: '⭐ Star Badge',
      description: 'प्रोफाइल पर Star बैज दिखाएं',
      cost: 100,
      icon: <Award className="h-6 w-6 text-yellow-500" />,
      category: 'badge'
    },
    {
      id: 'badge_genius',
      name: '🧠 Genius Badge',
      description: 'Genius बैज अनलॉक करें',
      cost: 250,
      icon: <Award className="h-6 w-6 text-purple-500" />,
      category: 'badge'
    },
    {
      id: 'theme_dark_pro',
      name: '🌙 Premium Dark Theme',
      description: 'Premium dark theme enable करें',
      cost: 150,
      icon: <Palette className="h-6 w-6 text-indigo-500" />,
      category: 'theme'
    },
    {
      id: 'boost_2x',
      name: '⚡ 2x Points Boost',
      description: '24 घंटे के लिए 2x points पाएं',
      cost: 300,
      icon: <Sparkles className="h-6 w-6 text-orange-500" />,
      category: 'boost'
    },
    {
      id: 'avatar_gold',
      name: '👑 Golden Avatar Frame',
      description: 'प्रोफाइल पर golden frame',
      cost: 500,
      icon: <Crown className="h-6 w-6 text-yellow-600" />,
      category: 'avatar'
    },
    {
      id: 'badge_champion',
      name: '🏆 Champion Badge',
      description: 'Champion का दर्जा पाएं',
      cost: 1000,
      icon: <Award className="h-6 w-6 text-red-500" />,
      category: 'badge'
    }
  ];

  useEffect(() => {
    const key = `${userId}_unlocked_items`;
    const saved = localStorage.getItem(key);
    if (saved) {
      setUnlockedItems(new Set(JSON.parse(saved)));
    }
  }, [userId]);

  const handlePurchase = (item: StoreItem) => {
    if (unlockedItems.has(item.id)) {
      toast.info('यह item पहले से unlocked है!');
      return;
    }

    if (currentPoints < item.cost) {
      toast.error(`आपके पास पर्याप्त points नहीं हैं! ${item.cost - currentPoints} और points चाहिए।`);
      return;
    }

    const newUnlocked = new Set(unlockedItems);
    newUnlocked.add(item.id);
    setUnlockedItems(newUnlocked);

    const key = `${userId}_unlocked_items`;
    localStorage.setItem(key, JSON.stringify(Array.from(newUnlocked)));

    // Save purchased item with details for profile display
    const purchasedItemsKey = `${userId}_purchased_items`;
    const existingItems = localStorage.getItem(purchasedItemsKey);
    const items = existingItems ? JSON.parse(existingItems) : [];
    
    const purchasedItem = {
      id: item.id,
      name: item.name,
      type: item.category,
      icon: item.name.split(' ')[0], // Extract emoji from name
      purchasedAt: new Date().toISOString()
    };
    
    // Check if item already purchased
    if (!items.find((i: any) => i.id === item.id)) {
      items.push(purchasedItem);
      localStorage.setItem(purchasedItemsKey, JSON.stringify(items));
    }

    onPurchase(item.id, item.cost);
    toast.success(`${item.name} successfully unlocked! 🎉`);
  };

  const categories = {
    badge: { name: 'Badges', icon: <Award className="h-5 w-5" /> },
    theme: { name: 'Themes', icon: <Palette className="h-5 w-5" /> },
    avatar: { name: 'Avatar Frames', icon: <Crown className="h-5 w-5" /> },
    boost: { name: 'Boosts', icon: <Sparkles className="h-5 w-5" /> }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-6 w-6" />
                Points Store
              </CardTitle>
              <CardDescription>अपने points से rewards unlock करें</CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              💰 {currentPoints} Points
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {Object.entries(categories).map(([categoryKey, categoryInfo]) => {
        const items = storeItems.filter(item => item.category === categoryKey);
        if (items.length === 0) return null;

        return (
          <div key={categoryKey}>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              {categoryInfo.icon}
              {categoryInfo.name}
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map(item => {
                const isUnlocked = unlockedItems.has(item.id);
                const canAfford = currentPoints >= item.cost;

                return (
                  <Card 
                    key={item.id}
                    className={`transition-all ${isUnlocked ? 'border-green-500 bg-green-500/5' : ''}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-background/50 rounded-lg">
                          {item.icon}
                        </div>
                        {isUnlocked ? (
                          <Badge variant="secondary" className="bg-green-500 text-white">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Unlocked
                          </Badge>
                        ) : (
                          <Badge variant="outline">{item.cost} Points</Badge>
                        )}
                      </div>
                      
                      <h4 className="font-semibold mb-1">{item.name}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                      
                      <Button
                        onClick={() => handlePurchase(item)}
                        disabled={isUnlocked || !canAfford}
                        className="w-full"
                        variant={isUnlocked ? 'secondary' : 'default'}
                      >
                        {isUnlocked ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Unlocked
                          </>
                        ) : !canAfford ? (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            {item.cost - currentPoints} Points और चाहिए
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="h-4 w-4 mr-2" />
                            {item.cost} Points में खरीदें
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PointsStore;
