
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Sparkles, Mail, ArrowLeft, Eye, EyeOff, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type AuthMethod = 'initial' | 'email' | 'phone';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<AuthMethod>('initial');
  const [showPassword, setShowPassword] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [phoneStep, setPhoneStep] = useState<'phone' | 'otp' | 'details'>('phone');
  const navigate = useNavigate();
  const { signup, signInWithGoogle, currentUser, isLoading: authLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && currentUser) {
      navigate('/');
    }
  }, [currentUser, authLoading, navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password || !confirmPassword) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!acceptedTerms) {
      toast.error("Please accept the terms and conditions");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    
    try {
      setIsLoading(true);
      await signup(email, password, {
        full_name: name
      });
      
      toast.success("Account created successfully!");
      navigate('/');
    } catch (error: any) {
      console.error(error);
      let errorMessage = "Registration failed";
      
      if (error.message?.includes('already registered')) {
        errorMessage = "Email already in use";
      } else if (error.message?.includes('invalid')) {
        errorMessage = "Invalid email format";
      } else if (error.message?.includes('weak')) {
        errorMessage = "Password is too weak";
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      toast.error("Please enter a valid phone number");
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
      setPhoneStep('otp');
      toast.success("OTP sent!");
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast.error("Please enter 6-digit OTP");
      return;
    }

    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: 'sms'
      });
      
      if (error) throw error;
      
      // After OTP verification, update profile with name
      if (data.user && name) {
        await supabase.from('profiles').update({
          display_name: name
        }).eq('user_id', data.user.id);
      }
      
      toast.success("Account created successfully!");
      navigate('/');
    } catch (error: any) {
      console.error(error);
      toast.error("Invalid OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name) {
      toast.error("Please enter your name");
      return;
    }

    if (!acceptedTerms) {
      toast.error("Please accept the terms and conditions");
      return;
    }

    // Move to OTP step
    handleSendOtp();
  };

  const handleGoogleSignUp = async () => {
    if (!acceptedTerms) {
      toast.error("Please accept the terms and conditions");
      return;
    }

    try {
      setIsGoogleLoading(true);
      await signInWithGoogle();
      // OAuth will redirect
    } catch (error: any) {
      console.error(error);
      toast.error("Google sign up failed");
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
        {/* Logo */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-semibold">Create your account</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Join Study AI to enhance your learning
          </p>
        </div>

        {/* Terms Checkbox */}
        <div className="flex items-start space-x-3 p-3 rounded-lg bg-secondary/50">
          <Checkbox 
            id="terms" 
            checked={acceptedTerms}
            onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
            className="mt-0.5"
          />
          <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight cursor-pointer">
            I accept the{' '}
            <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>
            {' '}and{' '}
            <Link to="/terms-of-service" className="text-primary hover:underline">Terms of Service</Link>
          </label>
        </div>

        {authMethod === 'initial' ? (
          <div className="space-y-3">
            {/* Google Sign Up */}
            <Button 
              type="button"
              variant="outline" 
              className="w-full h-12 text-base"
              onClick={handleGoogleSignUp}
              disabled={isGoogleLoading || !acceptedTerms}
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
              Continue with Google
            </Button>

            <div className="relative">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                or
              </span>
            </div>

            {/* Continue with Email */}
            <Button 
              type="button"
              variant="secondary" 
              className="w-full h-12 text-base"
              onClick={() => setAuthMethod('email')}
              disabled={!acceptedTerms}
            >
              <Mail className="w-5 h-5 mr-3" />
              Continue with Email
            </Button>

            {/* Continue with Phone */}
            <Button 
              type="button"
              variant="secondary" 
              className="w-full h-12 text-base"
              onClick={() => setAuthMethod('phone')}
              disabled={!acceptedTerms}
            >
              <Phone className="w-5 h-5 mr-3" />
              Continue with Phone
            </Button>

            {!acceptedTerms && (
              <p className="text-xs text-center text-amber-600 dark:text-amber-400">
                ⚠️ Please accept terms above to continue
              </p>
            )}
          </div>
        ) : authMethod === 'email' ? (
          <div className="space-y-4">
            <Button 
              type="button"
              variant="ghost" 
              size="sm"
              className="mb-2 -ml-2"
              onClick={() => setAuthMethod('initial')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="h-11"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="h-11"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    className="h-11 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Must be at least 6 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="h-11"
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-11"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></span>
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
          </div>
        ) : (
          // Phone Sign Up
          <div className="space-y-4">
            <Button 
              type="button"
              variant="ghost" 
              size="sm"
              className="mb-2 -ml-2"
              onClick={() => { 
                setAuthMethod('initial'); 
                setPhoneStep('phone'); 
                setIsOtpSent(false); 
                setOtp(''); 
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            {phoneStep === 'phone' ? (
              <form onSubmit={handlePhoneSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="h-11"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
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
                  type="submit" 
                  className="w-full h-11" 
                  disabled={isLoading || phone.length < 10 || !name}
                >
                  {isLoading ? (
                    <>
                      <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></span>
                      Sending OTP...
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Enter OTP</Label>
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
                    OTP sent to +91{phone}
                  </p>
                </div>
                
                <Button type="submit" className="w-full h-11" disabled={isLoading || otp.length !== 6}>
                  {isLoading ? (
                    <>
                      <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></span>
                      Verifying...
                    </>
                  ) : (
                    'Verify & Create Account'
                  )}
                </Button>

                <Button 
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => { setPhoneStep('phone'); setIsOtpSent(false); }}
                >
                  Resend OTP
                </Button>
              </form>
            )}
          </div>
        )}

        {/* Login Link */}
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
