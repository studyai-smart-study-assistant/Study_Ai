
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/student/Badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { 
  Palette, 
  Brain, 
  Clock, 
  Volume2, 
  Eye, 
  Hand,
  Settings,
  Save,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface PersonalizationSettings {
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
  studyDuration: number; // minutes
  breakDuration: number; // minutes
  preferredDifficulty: 'easy' | 'medium' | 'hard' | 'adaptive';
  notificationStyle: 'gentle' | 'motivational' | 'strict';
  theme: 'default' | 'focus' | 'energetic' | 'calm';
  pomodoroEnabled: boolean;
  reminderFrequency: number; // hours
  musicPreference: 'none' | 'instrumental' | 'nature' | 'white_noise';
  goalSetting: 'daily' | 'weekly' | 'monthly';
}

interface StudyPersonalizationProps {
  onSettingsChange: (settings: PersonalizationSettings) => void;
}

const StudyPersonalization: React.FC<StudyPersonalizationProps> = ({
  onSettingsChange
}) => {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState<PersonalizationSettings>({
    learningStyle: 'mixed',
    studyDuration: 45,
    breakDuration: 10,
    preferredDifficulty: 'adaptive',
    notificationStyle: 'motivational',
    theme: 'default',
    pomodoroEnabled: true,
    reminderFrequency: 2,
    musicPreference: 'instrumental',
    goalSetting: 'daily'
  });

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadPersonalizationSettings();
  }, [currentUser]);

  const loadPersonalizationSettings = () => {
    if (currentUser?.uid) {
      const saved = localStorage.getItem(`personalization_${currentUser.uid}`);
      if (saved) {
        try {
          const savedSettings = JSON.parse(saved);
          setSettings(savedSettings);
        } catch (error) {
          console.error('Error loading personalization settings:', error);
        }
      }
    }
  };

  const handleSettingChange = (key: keyof PersonalizationSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const saveSettings = () => {
    if (currentUser?.uid) {
      localStorage.setItem(`personalization_${currentUser.uid}`, JSON.stringify(settings));
      onSettingsChange(settings);
      setHasChanges(false);
      toast.success('🎯 आपकी preferences save हो गईं!');
    }
  };

  const getThemeColors = (theme: string) => {
    switch (theme) {
      case 'focus': return 'from-gray-50 to-blue-50 border-gray-200';
      case 'energetic': return 'from-orange-50 to-red-50 border-orange-200';
      case 'calm': return 'from-green-50 to-blue-50 border-green-200';
      default: return 'from-purple-50 to-indigo-50 border-purple-200';
    }
  };

  const getLearningStyleIcon = (style: string) => {
    switch (style) {
      case 'visual': return <Eye className="h-4 w-4" />;
      case 'auditory': return <Volume2 className="h-4 w-4" />;
      case 'kinesthetic': return <Hand className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <Card className={`bg-gradient-to-r ${getThemeColors(settings.theme)}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <Palette className="h-5 w-5" />
            Study Personalization
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
              Your Style
            </Badge>
          </CardTitle>
          <p className="text-sm text-gray-600">
            अपने study style के अनुसार customize करें
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="learning" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="learning">Learning</TabsTrigger>
          <TabsTrigger value="timing">Timing</TabsTrigger>
          <TabsTrigger value="environment">Environment</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="learning" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Learning Style Preference
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={settings.learningStyle}
                onValueChange={(value) => handleSettingChange('learningStyle', value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="visual" id="visual" />
                  <Label htmlFor="visual" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Visual - Charts, diagrams, visual aids
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="auditory" id="auditory" />
                  <Label htmlFor="auditory" className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    Auditory - Audio lectures, discussions
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="kinesthetic" id="kinesthetic" />
                  <Label htmlFor="kinesthetic" className="flex items-center gap-2">
                    <Hand className="h-4 w-4" />
                    Kinesthetic - Hands-on, practical
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mixed" id="mixed" />
                  <Label htmlFor="mixed" className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Mixed - Combination of all styles
                  </Label>
                </div>
              </RadioGroup>

              <div className="space-y-2">
                <Label>Preferred Difficulty Level</Label>
                <RadioGroup
                  value={settings.preferredDifficulty}
                  onValueChange={(value) => handleSettingChange('preferredDifficulty', value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="easy" id="easy" />
                    <Label htmlFor="easy">Easy - Gradual progression</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="medium" />
                    <Label htmlFor="medium">Medium - Balanced challenge</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hard" id="hard" />
                    <Label htmlFor="hard">Hard - Maximum challenge</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="adaptive" id="adaptive" />
                    <Label htmlFor="adaptive">Adaptive - AI adjusts automatically</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Study Timing Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Study Session Duration: {settings.studyDuration} minutes</Label>
                <Slider
                  value={[settings.studyDuration]}
                  onValueChange={(value) => handleSettingChange('studyDuration', value[0])}
                  min={15}
                  max={120}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Break Duration: {settings.breakDuration} minutes</Label>
                <Slider
                  value={[settings.breakDuration]}
                  onValueChange={(value) => handleSettingChange('breakDuration', value[0])}
                  min={5}
                  max={30}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="pomodoro">Enable Pomodoro Technique</Label>
                <Switch
                  id="pomodoro"
                  checked={settings.pomodoroEnabled}
                  onCheckedChange={(checked) => handleSettingChange('pomodoroEnabled', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label>Reminder Frequency: Every {settings.reminderFrequency} hours</Label>
                <Slider
                  value={[settings.reminderFrequency]}
                  onValueChange={(value) => handleSettingChange('reminderFrequency', value[0])}
                  min={1}
                  max={8}
                  step={1}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="environment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Study Environment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme Preference</Label>
                <RadioGroup
                  value={settings.theme}
                  onValueChange={(value) => handleSettingChange('theme', value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="default" id="default" />
                    <Label htmlFor="default">Default - Purple theme</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="focus" id="focus" />
                    <Label htmlFor="focus">Focus - Minimal distractions</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="energetic" id="energetic" />
                    <Label htmlFor="energetic">Energetic - High motivation</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="calm" id="calm" />
                    <Label htmlFor="calm">Calm - Peaceful environment</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Background Music Preference</Label>
                <RadioGroup
                  value={settings.musicPreference}
                  onValueChange={(value) => handleSettingChange('musicPreference', value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="none" />
                    <Label htmlFor="none">No music</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="instrumental" id="instrumental" />
                    <Label htmlFor="instrumental">Instrumental music</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nature" id="nature" />
                    <Label htmlFor="nature">Nature sounds</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="white_noise" id="white_noise" />
                    <Label htmlFor="white_noise">White noise</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Goal Setting</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Goal Setting Frequency</Label>
                <RadioGroup
                  value={settings.goalSetting}
                  onValueChange={(value) => handleSettingChange('goalSetting', value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="daily" id="daily" />
                    <Label htmlFor="daily">Daily goals</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="weekly" id="weekly" />
                    <Label htmlFor="weekly">Weekly goals</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="monthly" id="monthly" />
                    <Label htmlFor="monthly">Monthly goals</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Notification Style</Label>
                <RadioGroup
                  value={settings.notificationStyle}
                  onValueChange={(value) => handleSettingChange('notificationStyle', value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="gentle" id="gentle" />
                    <Label htmlFor="gentle">Gentle reminders</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="motivational" id="motivational" />
                    <Label htmlFor="motivational">Motivational messages</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="strict" id="strict" />
                    <Label htmlFor="strict">Strict accountability</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {hasChanges && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  आपकी settings में changes हैं
                </span>
              </div>
              <Button onClick={saveSettings} size="sm" className="bg-green-600 hover:bg-green-700">
                <Save className="h-3 w-3 mr-1" />
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudyPersonalization;
