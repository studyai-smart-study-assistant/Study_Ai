
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { Toaster as ToastToaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { TTSProvider } from '@/contexts/TTSContext';
import { MiniPlayerProvider } from '@/contexts/MiniPlayerContext';
import FloatingAudioPlayer from '@/components/audio/FloatingAudioPlayer';
import MiniPlayer from '@/components/studytube/MiniPlayer';
import UsageTracker from '@/components/UsageTracker';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import AppShell from '@/components/layout/AppShell';
import PageSkeleton from '@/components/common/PageSkeleton';

import { Suspense, lazy } from 'react';
import { useAppPermissions } from '@/hooks/useAppPermissions';
import { usePagePrefetcher } from '@/hooks/usePagePrefetcher'; // Import the new hook

// Lazy load pages for better performance
const Index = lazy(() => import('@/pages/Index'));
const Login = lazy(() => import('@/pages/Login'));
const Signup = lazy(() => import('@/pages/Signup'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
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
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const GroupStudyRoom = lazy(() => import('@/pages/GroupStudyRoom'));
const GroupChatRoom = lazy(() => import('@/pages/GroupChatRoom'));

// Page wrapper with skeleton fallback
const PageWrapper = ({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'chat' | 'form' | 'cards' | 'profile' }) => (
  <Suspense fallback={<PageSkeleton variant={variant} />}>
    {children}
  </Suspense>
);

function App() {
  useAppPermissions();
  usePagePrefetcher(); // Activate the page prefetcher

  return (
    <Router>
      <ErrorBoundary>
        <UsageTracker />
        <TTSProvider>
          <LanguageProvider>
            <MiniPlayerProvider>
              <NotificationProvider>
                <TooltipProvider>
                  <div className="min-h-screen bg-background">
                    <Routes>
                      {/* Routes wrapped in persistent AppShell */}
                      <Route element={<AppShell />}>
                        <Route path="/" element={<PageWrapper><Index /></PageWrapper>} />
                        <Route path="/login" element={<PageWrapper variant="form"><Login /></PageWrapper>} />
                        <Route path="/signup" element={<PageWrapper variant="form"><Signup /></PageWrapper>} />
                        <Route path="/forgot-password" element={<PageWrapper variant="form"><ForgotPassword /></PageWrapper>} />
                        <Route path="/reset-password" element={<PageWrapper variant="form"><ResetPassword /></PageWrapper>} />
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
                        <Route path="/group-study/:groupId" element={<PageWrapper variant="chat"><GroupStudyRoom /></PageWrapper>} />
                        <Route path="/group-chat/:groupId" element={<PageWrapper variant="chat"><GroupChatRoom /></PageWrapper>} />
                        <Route path="/admin/api-usage" element={<PageWrapper><AdminDashboard /></PageWrapper>} />
                        <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
                      </Route>
                    </Routes>
                  </div>
                  <MiniPlayer />
                  <FloatingAudioPlayer />
                  <Toaster />
                  <ToastToaster />
                </TooltipProvider>
              </NotificationProvider>
            </MiniPlayerProvider>
          </LanguageProvider>
        </TTSProvider>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
