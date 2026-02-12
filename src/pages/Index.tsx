
import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Chat from '@/components/Chat';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useChatInitialization } from '@/hooks/home/useChatInitialization';
import { useHomeEffects } from '@/hooks/home/useHomeEffects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  FileText,
  BookOpen,
  ClipboardList,
  GraduationCap,
  CalendarDays,
  Plus,
  ArrowUp,
  Mic,
  MicOff,
} from 'lucide-react';
import SignupPromptDialog from '@/components/home/SignupPromptDialog';

const Index = () => {
  const [inputMessage, setInputMessage] = useState('');
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { currentUser, isLoading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    currentChatId,
    isLoading,
    initializeChat,
    handleNavigationState,
    handleNewChat
  } = useChatInitialization();

  useHomeEffects({
    authLoading,
    isLoading,
    location,
    initializeChat,
    handleNavigationState
  });

  useEffect(() => {
    if (location.state?.newChat) {
      handleNewChat();
      window.history.replaceState({}, document.title);
    }
  }, [location.state?.newChat]);

  useEffect(() => {
    if (!currentUser && !authLoading) {
      const timer = setTimeout(() => {
        setShowSignupPrompt(true);
      }, 60000);
      return () => clearTimeout(timer);
    }
  }, [currentUser, authLoading]);

  const handleStartChat = async () => {
    if (!inputMessage.trim()) return;
    await handleNewChat();
  };

  const toggleVoiceInput = async () => {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const { toast } = await import('sonner');
      toast.error('Your browser does not support speech recognition');
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      const { toast } = await import('sonner');
      toast.error('Microphone permission denied. Please allow mic access.');
      return;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'hi-IN';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      setInputMessage(transcript);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    const { toast } = await import('sonner');
    toast.success('🎤 Listening... Speak now');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const quickActions = [
    { icon: FileText, label: 'Create Notes', path: '/notes-creator', bgColor: 'bg-blue-100 dark:bg-blue-900/30', textColor: 'text-blue-600 dark:text-blue-400', iconColor: 'text-blue-500' },
    { icon: BookOpen, label: 'Generate Quiz', path: '/quiz-generator', bgColor: 'bg-green-100 dark:bg-green-900/30', textColor: 'text-green-600 dark:text-green-400', iconColor: 'text-green-500' },
    { icon: ClipboardList, label: 'Homework Help', path: '/homework-helper', bgColor: 'bg-orange-100 dark:bg-orange-900/30', textColor: 'text-orange-600 dark:text-orange-400', iconColor: 'text-orange-500' },
    { icon: GraduationCap, label: 'Ask AI Teacher', path: '/teacher-chats', bgColor: 'bg-purple-100 dark:bg-purple-900/30', textColor: 'text-purple-600 dark:text-purple-400', iconColor: 'text-purple-500' },
    { icon: CalendarDays, label: 'Study Planner', path: '/study-planner', bgColor: 'bg-pink-100 dark:bg-pink-900/30', textColor: 'text-pink-600 dark:text-pink-400', iconColor: 'text-pink-500' },
  ];

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-full overflow-hidden">
        {currentChatId ? (
          <div className="flex-1 overflow-y-auto min-h-0">
            <Chat chatId={currentChatId} onChatUpdated={() => {}} />
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Centered Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 overflow-hidden">
              <h1 className="text-xl sm:text-2xl font-normal text-foreground mb-1">
                {getGreeting()}{currentUser?.displayName ? `, ${currentUser.displayName.split(' ')[0]}` : ''} 👋
              </h1>

              <p className="text-muted-foreground text-sm sm:text-base mb-8">
                How can Study AI help you today?
              </p>

              {/* Quick Action Buttons */}
              <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
                {quickActions.map((action) => (
                  <Link key={action.path} to={action.path}>
                    <div className={cn(
                      "flex flex-col items-center gap-2 px-3 py-4 rounded-2xl cursor-pointer transition-colors text-center",
                      action.bgColor
                    )}>
                      <action.icon className={cn("w-6 h-6", action.iconColor)} />
                      <span className={cn("text-[11px] font-medium leading-tight", action.textColor)}>
                        {action.label}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Input Box — pinned to bottom */}
            <div className="flex-shrink-0 p-4 pb-safe">
              <div className="max-w-2xl mx-auto">
                <div className="relative flex items-center bg-secondary/30 rounded-full border border-border">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full ml-1 text-muted-foreground"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-10 w-10 rounded-full",
                      isListening ? "text-red-500 animate-pulse" : "text-muted-foreground"
                    )}
                    onClick={toggleVoiceInput}
                    type="button"
                  >
                    {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </Button>
                  <Input
                    ref={inputRef}
                    placeholder="Ask anything..."
                    className="flex-1 bg-transparent border-0 focus-visible:ring-0 h-12 px-2 text-base placeholder:text-muted-foreground/60"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleStartChat();
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    className="h-10 w-10 rounded-full mr-1"
                    onClick={handleStartChat}
                    disabled={!inputMessage.trim()}
                  >
                    <ArrowUp className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <SignupPromptDialog
          open={showSignupPrompt}
          onOpenChange={setShowSignupPrompt}
        />
      </div>
    </ErrorBoundary>
  );
};

export default Index;
