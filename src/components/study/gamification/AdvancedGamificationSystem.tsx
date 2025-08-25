
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, 
  Star, 
  Target,
  Flame,
  Crown,
  Medal,
  Gift,
  Zap,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  unlocked: boolean;
  unlockedDate?: string;
  category: 'study' | 'streak' | 'social' | 'special';
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  reward: number;
  type: 'daily' | 'weekly' | 'monthly';
  deadline: string;
  completed: boolean;
}

const AdvancedGamificationSystem: React.FC = () => {
  const [userStats, setUserStats] = useState({
    totalPoints: 2850,
    level: 12,
    currentLevelProgress: 75,
    studyStreak: 15,
    weeklyGoal: 480,
    weeklyProgress: 320,
    rank: 23,
    totalUsers: 1250
  });

  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: '1',
      title: 'Study Master',
      description: '100 hours की study complete करें',
      icon: '🎓',
      points: 500,
      unlocked: true,
      unlockedDate: '2024-12-20',
      category: 'study'
    },
    {
      id: '2',
      title: 'Streak Champion',
      description: '30 दिन का continuous study streak',
      icon: '🔥',
      points: 1000,
      unlocked: false,
      category: 'streak'
    },
    {
      id: '3',
      title: 'Quiz Pro',
      description: '50 quizzes में 90%+ score करें',
      icon: '🧠',
      points: 750,
      unlocked: true,
      unlockedDate: '2024-12-25',
      category: 'study'
    },
    {
      id: '4',
      title: 'Social Learner',
      description: '10 study groups join करें',
      icon: '👥',
      points: 300,
      unlocked: false,
      category: 'social'
    }
  ]);

  const [challenges, setChallenges] = useState<Challenge[]>([
    {
      id: '1',
      title: 'Daily Study Goal',
      description: 'आज 2 hours study करें',
      target: 120,
      current: 85,
      reward: 50,
      type: 'daily',
      deadline: '2024-12-28',
      completed: false
    },
    {
      id: '2',
      title: 'Weekly Quiz Master',
      description: 'इस week 5 quizzes complete करें',
      target: 5,
      current: 3,
      reward: 200,
      type: 'weekly',
      deadline: '2024-12-29',
      completed: false
    },
    {
      id: '3',
      title: 'Monthly Consistency',
      description: 'इस month 25 दिन study करें',
      target: 25,
      current: 18,
      reward: 1000,
      type: 'monthly',
      deadline: '2024-12-31',
      completed: false
    }
  ]);

  const [rewards, setRewards] = useState([
    { id: '1', title: 'Study Break Token', cost: 100, owned: 3 },
    { id: '2', title: 'Premium Notes Access', cost: 500, owned: 1 },
    { id: '3', title: 'Personal Tutor Session', cost: 1000, owned: 0 },
    { id: '4', title: 'Certificate of Excellence', cost: 2000, owned: 0 }
  ]);

  const claimChallenge = (challengeId: string) => {
    setChallenges(prev => prev.map(challenge => 
      challenge.id === challengeId 
        ? { ...challenge, completed: true }
        : challenge
    ));
    
    const challenge = challenges.find(c => c.id === challengeId);
    if (challenge) {
      setUserStats(prev => ({
        ...prev,
        totalPoints: prev.totalPoints + challenge.reward
      }));
      toast.success(`🎉 Challenge completed! +${challenge.reward} points earned!`);
    }
  };

  const purchaseReward = (rewardId: string, cost: number) => {
    if (userStats.totalPoints >= cost) {
      setUserStats(prev => ({
        ...prev,
        totalPoints: prev.totalPoints - cost
      }));
      setRewards(prev => prev.map(reward => 
        reward.id === rewardId 
          ? { ...reward, owned: reward.owned + 1 }
          : reward
      ));
      toast.success('🎁 Reward purchased successfully!');
    } else {
      toast.error('❌ Insufficient points!');
    }
  };

  return (
    <div className="space-y-6">
      {/* User Stats Overview */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <Crown className="h-5 w-5" />
            Your Progress Dashboard
            <Badge className="bg-yellow-100 text-yellow-800">Level {userStats.level}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="font-bold text-lg">{userStats.totalPoints}</span>
              </div>
              <p className="text-xs text-gray-600">Total Points</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Flame className="h-4 w-4 text-red-500" />
                <span className="font-bold text-lg">{userStats.studyStreak}</span>
              </div>
              <p className="text-xs text-gray-600">Day Streak</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Trophy className="h-4 w-4 text-blue-500" />
                <span className="font-bold text-lg">#{userStats.rank}</span>
              </div>
              <p className="text-xs text-gray-600">Global Rank</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Target className="h-4 w-4 text-green-500" />
                <span className="font-bold text-lg">{Math.round((userStats.weeklyProgress / userStats.weeklyGoal) * 100)}%</span>
              </div>
              <p className="text-xs text-gray-600">Weekly Goal</p>
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Level Progress</span>
              <span>{userStats.currentLevelProgress}%</span>
            </div>
            <Progress value={userStats.currentLevelProgress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="challenges" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="challenges" className="space-y-4">
          <div className="grid gap-4">
            {challenges.map((challenge) => (
              <Card key={challenge.id} className="relative overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={challenge.type === 'daily' ? 'default' : challenge.type === 'weekly' ? 'secondary' : 'outline'}>
                          {challenge.type}
                        </Badge>
                        <h4 className="font-medium">{challenge.title}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{challenge.description}</p>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress: {challenge.current}/{challenge.target}</span>
                          <span className="flex items-center gap-1">
                            <Gift className="h-3 w-3" />
                            {challenge.reward} points
                          </span>
                        </div>
                        <Progress value={(challenge.current / challenge.target) * 100} className="h-2" />
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      {challenge.completed ? (
                        <Badge className="bg-green-100 text-green-800">Completed</Badge>
                      ) : challenge.current >= challenge.target ? (
                        <Button 
                          size="sm" 
                          onClick={() => claimChallenge(challenge.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Claim Reward
                        </Button>
                      ) : (
                        <Badge variant="outline">In Progress</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement) => (
              <Card key={achievement.id} className={`relative ${achievement.unlocked ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 opacity-60'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-medium flex items-center gap-2">
                        {achievement.title}
                        {achievement.unlocked && <Medal className="h-4 w-4 text-yellow-500" />}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          +{achievement.points} points
                        </Badge>
                        {achievement.unlocked && achievement.unlockedDate && (
                          <span className="text-xs text-green-600">
                            Unlocked: {achievement.unlockedDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <div className="grid gap-4">
            {rewards.map((reward) => (
              <Card key={reward.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">{reward.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {reward.cost} points
                        </span>
                        <span>Owned: {reward.owned}</span>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => purchaseReward(reward.id, reward.cost)}
                      disabled={userStats.totalPoints < reward.cost}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Gift className="h-3 w-3 mr-1" />
                      Purchase
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Weekly Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1,2,3,4,5].map((rank) => (
                  <div key={rank} className={`flex items-center gap-3 p-3 rounded-lg ${rank === userStats.rank ? 'bg-purple-100 border border-purple-300' : 'bg-gray-50'}`}>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                      {rank}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {rank === userStats.rank ? 'You' : `Student ${rank}`}
                      </p>
                      <p className="text-sm text-gray-600">{2850 - (rank * 150)} points</p>
                    </div>
                    {rank <= 3 && (
                      <Trophy className={`h-5 w-5 ${rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-gray-400' : 'text-amber-600'}`} />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedGamificationSystem;
