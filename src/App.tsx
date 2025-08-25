
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
const CampusTalks = lazy(() => import('@/pages/CampusTalks'));
const TeacherChats = lazy(() => import('@/pages/TeacherChats'));
const Leaderboard = lazy(() => import('@/pages/Leaderboard'));
const Library = lazy(() => import('@/pages/Library'));
const ChatHistory = lazy(() => import('@/pages/ChatHistory'));
const SavedMessages = lazy(() => import('@/pages/SavedMessages'));
const StudyTube = lazy(() => import('@/pages/StudyTube'));
const InteractiveTeacher = lazy(() => import('@/pages/InteractiveTeacher'));
const NotFound = lazy(() => import('@/pages/NotFound'));


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    },
  },
});

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
                          <Suspense fallback={
                            <div className="min-h-screen bg-background flex items-center justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                          }>
                            <Routes>
                              <Route path="/" element={<Index />} />
                              <Route path="/login" element={<Login />} />
                              <Route path="/signup" element={<Signup />} />
                              <Route path="/forgot-password" element={<ForgotPassword />} />
                              <Route path="/profile" element={<Profile />} />
                              <Route path="/student/:userId" element={<StudentProfile />} />
                              <Route path="/student-activities" element={<StudentActivities />} />
                              <Route path="/about" element={<AboutPage />} />
                              <Route path="/chat-system" element={<ChatSystem />} />
                              <Route path="/enhanced-chat" element={<SupabaseChatSystem />} />
                              <Route path="/campus-talks" element={<CampusTalks />} />
                              <Route path="/teacher-chats" element={<TeacherChats />} />
                              <Route path="/leaderboard" element={<Leaderboard />} />
                              <Route path="/library" element={<Library />} />
                              <Route path="/study-tube" element={<StudyTube />} />
                              <Route path="/chat-history" element={<ChatHistory />} />
                              <Route path="/saved-messages" element={<SavedMessages />} />
                              <Route path="/interactive-teacher/:sessionId" element={<InteractiveTeacher />} />
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          </Suspense>
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
