import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getLevelColor } from '@/utils/qrCodeUtils';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

interface StudentProfileCardProps {
  currentUser: any;
  studentPoints: number;
  studentLevel: number;
  streakDays: number;
  rank?: number;
}

interface PurchasedItem {
  id: string;
  name: string;
  type: 'badge' | 'theme' | 'avatar' | 'boost';
  icon?: string;
}

const StudentProfileCard: React.FC<StudentProfileCardProps> = ({
  currentUser,
  studentPoints,
  studentLevel,
  streakDays,
  rank
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [purchasedItems, setPurchasedItems] = useState<PurchasedItem[]>([]);

  useEffect(() => {
    // Load purchased items from localStorage
    const loadPurchasedItems = () => {
      const items = localStorage.getItem(`${currentUser?.uid}_purchased_items`);
      if (items) {
        setPurchasedItems(JSON.parse(items));
      }
    };
    
    if (currentUser?.uid) {
      loadPurchasedItems();
    }
  }, [currentUser?.uid]);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false
      });
      
      const link = document.createElement('a');
      link.download = `${currentUser.displayName || 'profile'}-card.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      toast.success('प्रोफाइल कार्ड डाउनलोड हो गया!');
    } catch (error) {
      console.error('Error downloading card:', error);
      toast.error('कार्ड डाउनलोड करने में समस्या आई');
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `${currentUser.displayName || 'Student'} का प्रोफाइल`,
      text: `मैं ${studentPoints} points और ${streakDays} दिन की streak के साथ Level ${studentLevel} पर हूं!`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success('प्रोफाइल शेयर हो गया!');
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
      toast.success('लिंक कॉपी हो गया!');
    }
  };

  const badgeItems = purchasedItems.filter(item => item.type === 'badge');

  return (
    <div className="space-y-4">
      <Card 
        ref={cardRef}
        className="overflow-hidden border-2 shadow-xl"
        style={{
          background: `linear-gradient(135deg, ${getLevelColor(studentLevel)}20 0%, ${getLevelColor(studentLevel)}05 50%, #ffffff 100%)`,
          borderColor: getLevelColor(studentLevel)
        }}
      >
        <CardContent className="p-8">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-5">
              <div className="relative">
                <Avatar className="h-24 w-24 shadow-2xl border-2 border-background" style={{ 
                  boxShadow: `0 0 0 4px ${getLevelColor(studentLevel)}`
                }}>
                  {currentUser.photoURL ? (
                    <AvatarImage 
                      src={currentUser.photoURL} 
                      alt={currentUser.displayName}
                      crossOrigin="anonymous"
                      className="object-cover"
                    />
                  ) : null}
                  <AvatarFallback 
                    className="text-3xl font-bold text-white" 
                    style={{ backgroundColor: getLevelColor(studentLevel) }}
                  >
                    {currentUser.displayName?.[0] || 'S'}
                  </AvatarFallback>
                </Avatar>
                <div 
                  className="absolute -bottom-2 -right-2 rounded-full p-2 shadow-lg font-bold text-white text-xs"
                  style={{ backgroundColor: getLevelColor(studentLevel) }}
                >
                  L{studentLevel}
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {currentUser.displayName || 'Student'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">{currentUser.email}</p>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {rank && (
                    <Badge className="shadow-md" style={{ backgroundColor: getLevelColor(studentLevel) }}>
                      🏆 Rank #{rank}
                    </Badge>
                  )}
                  {badgeItems.slice(0, 3).map((item) => (
                    <Badge key={item.id} variant="secondary" className="shadow-sm">
                      {item.icon} {item.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-gradient-to-br from-background to-background/50 rounded-xl shadow-inner border">
              <div className="text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent" style={{ 
                backgroundImage: `linear-gradient(135deg, ${getLevelColor(studentLevel)}, ${getLevelColor(studentLevel)}80)` 
              }}>
                {studentPoints}
              </div>
              <div className="text-xs text-muted-foreground mt-1 font-medium">Total Points</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-background/50 rounded-xl shadow-inner border border-orange-200">
              <div className="text-3xl font-bold text-orange-600">
                {streakDays} 🔥
              </div>
              <div className="text-xs text-muted-foreground mt-1 font-medium">Day Streak</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-background/50 rounded-xl shadow-inner border border-blue-200">
              <div className="text-3xl font-bold text-blue-600">
                {studentLevel}
              </div>
              <div className="text-xs text-muted-foreground mt-1 font-medium">Level</div>
            </div>
          </div>

          {badgeItems.length > 3 && (
            <div className="mb-4 p-3 bg-background/30 rounded-lg border">
              <p className="text-xs text-muted-foreground text-center">
                और {badgeItems.length - 3} badges अर्जित किए
              </p>
            </div>
          )}

          <div className="text-center text-sm font-medium border-t pt-4" style={{ color: getLevelColor(studentLevel) }}>
            शिक्षा के साथ, सफलता की ओर 🎓
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={handleDownload} className="flex-1" variant="outline">
          <Download className="h-4 w-4 mr-2" />
          डाउनलोड करें
        </Button>
        <Button onClick={handleShare} className="flex-1">
          <Share2 className="h-4 w-4 mr-2" />
          शेयर करें
        </Button>
      </div>
    </div>
  );
};

export default StudentProfileCard;
