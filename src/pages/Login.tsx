
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '@/lib/firebase';
import { signInWithGoogle } from '@/lib/firebase/googleAuth';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Sparkles, Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { messageLimitReached } = useAuth();
  const { language, setLanguage } = useLanguage();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error(language === 'hi' ? "कृपया ईमेल और पासवर्ड दोनों दर्ज करें" : "Please enter both email and password");
      return;
    }
    
    try {
      setIsLoading(true);
      await loginUser(email, password);
      toast.success(language === 'hi' ? "सफलतापूर्वक लॉगिन हो गए!" : "Login successful!");
      navigate('/');
    } catch (error: any) {
      console.error(error);
      let errorMessage = language === 'hi' ? "लॉगिन विफल" : "Login failed";
      
      if (error.code === 'auth/invalid-credential') {
        errorMessage = language === 'hi' ? "गलत ईमेल या पासवर्ड" : "Invalid email or password";
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = language === 'hi' ? "यूजर नहीं मिला" : "User not found";
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = language === 'hi' ? "गलत पासवर्ड" : "Incorrect password";
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      await signInWithGoogle();
      toast.success(language === 'hi' ? "Google से सफलतापूर्वक लॉगिन!" : "Successfully signed in with Google!");
      navigate('/');
    } catch (error: any) {
      console.error(error);
      let errorMessage = language === 'hi' ? "Google साइन इन विफल" : "Google sign in failed";
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = language === 'hi' ? "साइन इन रद्द किया गया" : "Sign in cancelled";
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = language === 'hi' ? "पॉपअप ब्लॉक हो गया, कृपया पॉपअप अनुमति दें" : "Popup blocked, please allow popups";
      }
      
      toast.error(errorMessage);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-900 dark:to-purple-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6">
        {/* Language Selector */}
        <div className="flex justify-end">
          <Select value={language} onValueChange={(value: 'en' | 'hi') => setLanguage(value)}>
            <SelectTrigger className="w-32">
              <Globe className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="hi">हिंदी</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col items-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
            <Sparkles />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {language === 'hi' ? 'वापस आपका स्वागत है' : 'Welcome Back'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {language === 'hi' ? 'Study AI के साथ जारी रखने के लिए साइन इन करें' : 'Sign in to continue with Study AI'}
          </p>
        </div>

        {/* Google Sign In Button */}
        <Button 
          type="button"
          variant="outline" 
          className="w-full flex items-center justify-center gap-3 py-5 border-2"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
        >
          {isGoogleLoading ? (
            <span className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {language === 'hi' ? 'Google से साइन इन करें' : 'Sign in with Google'}
        </Button>

        <div className="relative">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 px-2 text-xs text-muted-foreground">
            {language === 'hi' ? 'या' : 'or'}
          </span>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              {language === 'hi' ? 'ईमेल' : 'Email'}
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={language === 'hi' ? "आपका ईमेल पता" : "your.email@example.com"}
              required
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">
                {language === 'hi' ? 'पासवर्ड' : 'Password'}
              </Label>
              <Link to="/forgot-password" className="text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                {language === 'hi' ? 'पासवर्ड भूल गए?' : 'Forgot password?'}
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center justify-center">
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                {language === 'hi' ? 'साइन इन हो रहा है...' : 'Signing in...'}
              </span>
            ) : (
              language === 'hi' ? 'साइन इन करें' : 'Sign In'
            )}
          </Button>
        </form>
        
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          {language === 'hi' ? 'कोई अकाउंट नहीं है?' : "Don't have an account?"}{" "}
          <Link to="/signup" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 font-medium">
            {language === 'hi' ? 'साइन अप करें' : 'Sign up'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
