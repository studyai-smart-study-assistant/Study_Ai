
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { Toaster as ToastToaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryProvider } from '@/contexts/QueryContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ThemeProvider } from './providers/ThemeProvider';
import UsageTracker from '@/components/UsageTracker';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import AppShell from '@/components/layout/AppShell';
import PageSkeleton from '@/components/common/PageSkeleton';

import { Suspense, lazy } from 'react';

// Lazy load pages for better performance
const Index = lazy(() => import('@/pages/Index'));
const Login = lazy(() => import('@/pages/Login'));
const Signup = lazy(() => import('@/pages/Signup'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const Profile = lazy(() => import('@/pages/Profile'));
const StudentProfile = lazy(() => import('@/pages/StudentProfile'));
const StudentActivities = lazy(() => import('@/pages/StudentActivities'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const ChatSystem = lazy(() => import('@/pages/ChatSystem'));
const SupabaseChatSystem = lazy(() => import('@/pages/SupabaseChatSystem'));
const TeacherChats = lazy(() => import('@/pages/TeacherChats'));
const Leaderboard = lazy(() => import('@/pages/Leaderboard'));
const Library = lazy(() => import('@/pages/Library'));
const ChatHistory = lazy(() => import('@/pages/ChatHistory'));
const SavedMessages = lazy(() => import('@/pages/SavedMessages'));
const StudyTube = lazy(() => import('@/pages/StudyTube'));
const InteractiveTeacher = lazy(() => import('@/pages/InteractiveTeacher'));
const NotesView = lazy(() => import('@/pages/NotesView'));
const NotesAdGate = lazy(() => import('@/pages/NotesAdGate'));
const PointsWalletPage = lazy(() => import('@/pages/PointsWalletPage'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('@/pages/TermsOfService'));
const NotesCreator = lazy(() => import('@/pages/NotesCreator'));
const QuizGeneratorPage = lazy(() => import('@/pages/QuizGeneratorPage'));
const StudyPlannerPage = lazy(() => import('@/pages/StudyPlannerPage'));
const HomeworkHelperPage = lazy(() => import('@/pages/HomeworkHelperPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
});

// Page wrapper with skeleton fallback - no global spinner!
const PageWrapper = ({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'chat' | 'form' | 'cards' | 'profile' }) => (
  <Suspense fallback={<PageSkeleton variant={variant} />}>
    {children}
  </Suspense>
);

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <QueryProvider>
            <AuthProvider>
              <UsageTracker />
              <LanguageProvider>
                <NotificationProvider>
                  <TooltipProvider>
                    <Router>
                      <div className="min-h-screen bg-background">
                        <Routes>
                          {/* Routes wrapped in persistent AppShell */}
                          <Route element={<AppShell />}>
                            <Route path="/" element={<PageWrapper><Index /></PageWrapper>} />
                            <Route path="/login" element={<PageWrapper variant="form"><Login /></PageWrapper>} />
                            <Route path="/signup" element={<PageWrapper variant="form"><Signup /></PageWrapper>} />
                            <Route path="/forgot-password" element={<PageWrapper variant="form"><ForgotPassword /></PageWrapper>} />
                            <Route path="/profile" element={<PageWrapper variant="profile"><Profile /></PageWrapper>} />
                            <Route path="/student/:userId" element={<PageWrapper variant="profile"><StudentProfile /></PageWrapper>} />
                            <Route path="/student-activities" element={<PageWrapper><StudentActivities /></PageWrapper>} />
                            <Route path="/about" element={<PageWrapper><AboutPage /></PageWrapper>} />
                            <Route path="/chat-system" element={<PageWrapper variant="chat"><ChatSystem /></PageWrapper>} />
                            <Route path="/enhanced-chat" element={<PageWrapper variant="chat"><SupabaseChatSystem /></PageWrapper>} />
                            <Route path="/teacher-chats" element={<PageWrapper variant="chat"><TeacherChats /></PageWrapper>} />
                            <Route path="/leaderboard" element={<PageWrapper variant="cards"><Leaderboard /></PageWrapper>} />
                            <Route path="/library" element={<PageWrapper variant="cards"><Library /></PageWrapper>} />
                            <Route path="/study-tube" element={<PageWrapper variant="cards"><StudyTube /></PageWrapper>} />
                            <Route path="/chat-history" element={<PageWrapper variant="chat"><ChatHistory /></PageWrapper>} />
                            <Route path="/saved-messages" element={<PageWrapper variant="chat"><SavedMessages /></PageWrapper>} />
                            <Route path="/interactive-teacher/:sessionId" element={<PageWrapper variant="chat"><InteractiveTeacher /></PageWrapper>} />
                            <Route path="/notes-ad" element={<PageWrapper><NotesAdGate /></PageWrapper>} />
                            <Route path="/notes-view" element={<PageWrapper><NotesView /></PageWrapper>} />
                            <Route path="/points-wallet" element={<PageWrapper><PointsWalletPage /></PageWrapper>} />
                            <Route path="/privacy-policy" element={<PageWrapper><PrivacyPolicy /></PageWrapper>} />
                            <Route path="/terms-of-service" element={<PageWrapper><TermsOfService /></PageWrapper>} />
                            <Route path="/notes-creator" element={<PageWrapper variant="form"><NotesCreator /></PageWrapper>} />
                            <Route path="/quiz-generator" element={<PageWrapper variant="form"><QuizGeneratorPage /></PageWrapper>} />
                            <Route path="/study-planner" element={<PageWrapper variant="form"><StudyPlannerPage /></PageWrapper>} />
                            <Route path="/homework-helper" element={<PageWrapper variant="form"><HomeworkHelperPage /></PageWrapper>} />
                            <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
                          </Route>
                        </Routes>
                      </div>
                      <Toaster />
                      <ToastToaster />
                    </Router>
                  </TooltipProvider>
                </NotificationProvider>
              </LanguageProvider>
            </AuthProvider>
          </QueryProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
