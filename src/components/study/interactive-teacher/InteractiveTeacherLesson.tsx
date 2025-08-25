
import React, { useState, useEffect } from 'react';
import { TeacherMessage, ConversationContext } from '@/hooks/interactive-teacher/types';
import LessonProgressIndicator from './LessonProgressIndicator';
import TeacherMessageDisplay from './TeacherMessageDisplay';
import StudentInputArea from './StudentInputArea';
import LoadingTeacher from './LoadingTeacher';
import VoiceInteractionManager from './VoiceInteractionManager';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare, 
  Mic, 
  Settings, 
  Headphones 
} from 'lucide-react';

interface InteractiveTeacherLessonProps {
  messages: TeacherMessage[];
  currentContext: ConversationContext | null;
  isWaitingForStudent: boolean;
  isProcessing: boolean;
  onResetLesson: () => void;
  onShowQuestionDialog: () => void;
  onSubmitAnswer: (answer: string) => void;
}

const InteractiveTeacherLesson: React.FC<InteractiveTeacherLessonProps> = ({
  messages,
  currentContext,
  isWaitingForStudent,
  isProcessing,
  onResetLesson,
  onSubmitAnswer
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [currentTeacherMessage, setCurrentTeacherMessage] = useState('');
  const isMobile = useIsMobile();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    // Update current teacher message for voice output
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.content) {
      setCurrentTeacherMessage(lastMessage.content);
    }
  }, [messages]);

  const handleVoiceInput = (text: string) => {
    onSubmitAnswer(text);
  };

  const handleVoiceToggle = (enabled: boolean) => {
    setVoiceEnabled(enabled);
  };

  if (messages.length === 0) {
    return <LoadingTeacher />;
  }

  return (
    <motion.div 
      className={`w-full mx-auto space-y-6 sm:space-y-8 ${
        isMobile ? 'pb-24 max-w-full' : 'pb-28 max-w-4xl'
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Enhanced Header with Voice Status */}
      <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardContent className="p-4">
          <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center justify-between'}`}>
            <div className="flex items-center gap-3">
              <Badge className="bg-green-100 text-green-800">
                Live Teaching Active
              </Badge>
              {voiceEnabled && (
                <Badge className="bg-blue-100 text-blue-800">
                  <Headphones className="h-3 w-3 mr-1" />
                  Voice Enhanced
                </Badge>
              )}
            </div>
            
            {currentContext?.subject && (
              <div className="text-sm text-indigo-700 font-medium">
                Subject: {currentContext.subject}
                {currentContext.chapter && ` • ${currentContext.chapter}`}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Progress indicator */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <LessonProgressIndicator messages={messages} />
      </motion.div>

      {/* Enhanced Interface with Tabs */}
      <Tabs defaultValue="conversation" className="w-full">
        <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2' : 'grid-cols-3'}`}>
          <TabsTrigger value="conversation" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Conversation
          </TabsTrigger>
          <TabsTrigger value="voice" className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            Voice Mode
          </TabsTrigger>
          {!isMobile && (
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="conversation" className="space-y-4">
          {/* Message display with proper spacing to prevent overlap with input */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className={`space-y-4 sm:space-y-6 ${isMobile ? 'px-1' : ''}`}
            style={{ marginBottom: isMobile ? '120px' : '140px' }}
          >
            <TeacherMessageDisplay 
              messages={messages} 
              isProcessing={isProcessing} 
            />
          </motion.div>

          {/* Student Input Area */}
          <AnimatePresence>
            {messages.length > 0 && (
              <StudentInputArea 
                onSubmitAnswer={onSubmitAnswer}
                isProcessing={isProcessing}
              />
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="voice" className="space-y-4">
          <VoiceInteractionManager
            onVoiceInput={handleVoiceInput}
            onVoiceToggle={handleVoiceToggle}
            isProcessing={isProcessing}
            currentMessage={currentTeacherMessage}
          />
          
          {/* Voice-optimized message display */}
          <motion.div
            className={`space-y-4 ${isMobile ? 'px-1' : ''}`}
            style={{ marginBottom: isMobile ? '80px' : '100px' }}
          >
            <TeacherMessageDisplay 
              messages={messages.slice(-3)} // Show only last 3 messages in voice mode
              isProcessing={isProcessing} 
            />
          </motion.div>
        </TabsContent>

        {!isMobile && (
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-4">Lesson Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Auto-voice response</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setVoiceEnabled(!voiceEnabled)}
                    >
                      {voiceEnabled ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Lesson difficulty</span>
                    <Badge variant="outline">Adaptive</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Language mix</span>
                    <Badge variant="outline">Hindi + English</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </motion.div>
  );
};

export default InteractiveTeacherLesson;
