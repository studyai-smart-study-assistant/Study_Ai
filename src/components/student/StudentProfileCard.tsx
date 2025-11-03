import React, { useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share2, QrCode } from 'lucide-react';
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

const StudentProfileCard: React.FC<StudentProfileCardProps> = ({
  currentUser,
  studentPoints,
  studentLevel,
  streakDays,
  rank
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2
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

  return (
    <div className="space-y-4">
      <Card 
        ref={cardRef}
        className="overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${getLevelColor(studentLevel)}15 0%, ${getLevelColor(studentLevel)}05 100%)`
        }}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 ring-4 ring-white shadow-lg">
                <AvatarImage src={currentUser.photoURL} alt={currentUser.displayName} />
                <AvatarFallback className="text-2xl font-bold" style={{ backgroundColor: getLevelColor(studentLevel) }}>
                  {currentUser.displayName?.[0] || 'S'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-2xl font-bold">{currentUser.displayName || 'Student'}</h3>
                <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                {rank && (
                  <Badge variant="secondary" className="mt-2">
                    🏆 Rank #{rank}
                  </Badge>
                )}
              </div>
            </div>
            <Badge 
              className="text-lg px-4 py-2"
              style={{ backgroundColor: getLevelColor(studentLevel) }}
            >
              Level {studentLevel}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-background/50 rounded-lg backdrop-blur">
              <div className="text-2xl font-bold" style={{ color: getLevelColor(studentLevel) }}>
                {studentPoints}
              </div>
              <div className="text-xs text-muted-foreground">Total Points</div>
            </div>
            <div className="text-center p-3 bg-background/50 rounded-lg backdrop-blur">
              <div className="text-2xl font-bold text-orange-600">
                {streakDays} 🔥
              </div>
              <div className="text-xs text-muted-foreground">Day Streak</div>
            </div>
            <div className="text-center p-3 bg-background/50 rounded-lg backdrop-blur">
              <div className="text-2xl font-bold text-blue-600">
                {studentLevel}
              </div>
              <div className="text-xs text-muted-foreground">Level</div>
            </div>
          </div>

          <div className="text-center text-xs text-muted-foreground border-t pt-3">
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
