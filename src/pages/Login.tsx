
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
      
      // If user came from message limit, go back to chat, otherwise to home
      if (messageLimitReached) {
        navigate('/');
      } else {
        navigate('/');
      }
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
