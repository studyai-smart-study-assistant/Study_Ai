
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Sparkles, Globe, Mail, ArrowLeft, Phone } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';

type AuthMethod = 'initial' | 'email' | 'phone';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<AuthMethod>('initial');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const navigate = useNavigate();
  const { login, signInWithGoogle, currentUser, isLoading: authLoading } = useAuth();
  const { language, setLanguage } = useLanguage();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && currentUser) {
      navigate('/');
    }
  }, [currentUser, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error(language === 'hi' ? "कृपया ईमेल और पासवर्ड दोनों दर्ज करें" : "Please enter both email and password");
      return;
    }
    
    try {
      setIsLoading(true);
      await login(email, password);
      toast.success(language === 'hi' ? "सफलतापूर्वक लॉगिन हो गए!" : "Login successful!");
      navigate('/');
    } catch (error: any) {
      console.error(error);
      let errorMessage = language === 'hi' ? "लॉगिन विफल" : "Login failed";
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = language === 'hi' ? "गलत ईमेल या पासवर्ड" : "Invalid email or password";
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = language === 'hi' ? "कृपया पहले अपना ईमेल वेरिफाई करें" : "Please verify your email first";
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      toast.error(language === 'hi' ? "कृपया सही फोन नंबर दर्ज करें" : "Please enter a valid phone number");
      return;
    }

    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });
      
      if (error) throw error;
      
      setIsOtpSent(true);
      toast.success(language === 'hi' ? "OTP भेजा गया!" : "OTP sent!");
    } catch (error: any) {
      console.error(error);
      toast.error(language === 'hi' ? "OTP भेजने में विफल" : "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast.error(language === 'hi' ? "कृपया 6 अंकों का OTP दर्ज करें" : "Please enter 6-digit OTP");
      return;
    }

    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: 'sms'
      });
      
      if (error) throw error;
      
      toast.success(language === 'hi' ? "सफलतापूर्वक लॉगिन हो गए!" : "Login successful!");
      navigate('/');
    } catch (error: any) {
      console.error(error);
      toast.error(language === 'hi' ? "गलत OTP" : "Invalid OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      await signInWithGoogle();
      // OAuth will redirect, no need to navigate
    } catch (error: any) {
      console.error(error);
      toast.error(language === 'hi' ? "Google साइन इन विफल" : "Google sign in failed");
      setIsGoogleLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Language Selector */}
        <div className="flex justify-end">
          <Select value={language} onValueChange={(value: 'en' | 'hi') => setLanguage(value)}>
            <SelectTrigger className="w-28">
              <Globe className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="hi">हिंदी</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Logo */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-semibold">
            {language === 'hi' ? 'वापस आपका स्वागत है' : 'Welcome Back'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {language === 'hi' ? 'Study AI के साथ जारी रखने के लिए साइन इन करें' : 'Sign in to continue with Study AI'}
          </p>
        </div>

        {authMethod === 'initial' ? (
          // Initial View - Just buttons
          <div className="space-y-3">
            {/* Google Sign In Button */}
            <Button 
              type="button"
              variant="outline" 
              className="w-full h-12 text-base"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <span className="h-5 w-5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mr-3"></span>
              ) : (
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              {language === 'hi' ? 'Google से जारी रखें' : 'Continue with Google'}
            </Button>

            <div className="relative">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                {language === 'hi' ? 'या' : 'or'}
              </span>
            </div>

            {/* Continue with Email Button */}
            <Button 
              type="button"
              variant="secondary" 
              className="w-full h-12 text-base"
              onClick={() => setAuthMethod('email')}
            >
              <Mail className="w-5 h-5 mr-3" />
              {language === 'hi' ? 'ईमेल से जारी रखें' : 'Continue with Email'}
            </Button>

            {/* Continue with Phone Button */}
            <Button 
              type="button"
              variant="secondary" 
              className="w-full h-12 text-base"
              onClick={() => setAuthMethod('phone')}
            >
              <Phone className="w-5 h-5 mr-3" />
              {language === 'hi' ? 'फोन नंबर से जारी रखें' : 'Continue with Phone'}
            </Button>
          </div>
        ) : authMethod === 'email' ? (
          // Email Form View
          <div className="space-y-4">
            <Button 
              type="button"
              variant="ghost" 
              size="sm"
              className="mb-2 -ml-2"
              onClick={() => setAuthMethod('initial')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {language === 'hi' ? 'वापस जाएं' : 'Go back'}
            </Button>
            
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
                  className="h-11"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">
                    {language === 'hi' ? 'पासवर्ड' : 'Password'}
                  </Label>
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                    {language === 'hi' ? 'पासवर्ड भूल गए?' : 'Forgot password?'}
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11"
                  required
                />
              </div>
              
              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></span>
                    {language === 'hi' ? 'साइन इन हो रहा है...' : 'Signing in...'}
                  </>
                ) : (
                  language === 'hi' ? 'साइन इन करें' : 'Sign In'
                )}
              </Button>
            </form>
          </div>
        ) : (
          // Phone Form View
          <div className="space-y-4">
            <Button 
              type="button"
              variant="ghost" 
              size="sm"
              className="mb-2 -ml-2"
              onClick={() => { setAuthMethod('initial'); setIsOtpSent(false); setOtp(''); }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {language === 'hi' ? 'वापस जाएं' : 'Go back'}
            </Button>
            
            {!isOtpSent ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    {language === 'hi' ? 'फोन नंबर' : 'Phone Number'}
                  </Label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 bg-secondary rounded-md text-sm">
                      +91
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9876543210"
                      className="h-11 flex-1"
                      maxLength={10}
                    />
                  </div>
                </div>
                
                <Button 
                  type="button" 
                  className="w-full h-11" 
                  disabled={isLoading || phone.length < 10}
                  onClick={handleSendOtp}
                >
                  {isLoading ? (
                    <>
                      <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></span>
                      {language === 'hi' ? 'OTP भेज रहा है...' : 'Sending OTP...'}
                    </>
                  ) : (
                    language === 'hi' ? 'OTP भेजें' : 'Send OTP'
                  )}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">
                    {language === 'hi' ? 'OTP दर्ज करें' : 'Enter OTP'}
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="h-11 text-center text-lg tracking-widest"
                    maxLength={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    {language === 'hi' ? `+91${phone} पर OTP भेजा गया` : `OTP sent to +91${phone}`}
                  </p>
                </div>
                
                <Button type="submit" className="w-full h-11" disabled={isLoading || otp.length !== 6}>
                  {isLoading ? (
                    <>
                      <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></span>
                      {language === 'hi' ? 'वेरिफाई हो रहा है...' : 'Verifying...'}
                    </>
                  ) : (
                    language === 'hi' ? 'वेरिफाई करें' : 'Verify OTP'
                  )}
                </Button>

                <Button 
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setIsOtpSent(false)}
                >
                  {language === 'hi' ? 'OTP दोबारा भेजें' : 'Resend OTP'}
                </Button>
              </form>
            )}
          </div>
        )}
        
        {/* Sign up link */}
        <p className="text-center text-sm text-muted-foreground">
          {language === 'hi' ? 'कोई अकाउंट नहीं है?' : "Don't have an account?"}{" "}
          <Link to="/signup" className="text-primary hover:underline font-medium">
            {language === 'hi' ? 'साइन अप करें' : 'Sign up'}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
