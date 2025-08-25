
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { resetPassword } from '@/lib/firebase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, ArrowLeft, Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error(language === 'hi' ? "कृपया अपना ईमेल पता दर्ज करें" : "Please enter your email address");
      return;
    }
    
    try {
      setIsLoading(true);
      await resetPassword(email);
      setEmailSent(true);
      toast.success(language === 'hi' ? "पासवर्ड रीसेट लिंक भेजा गया!" : "Password reset link sent!");
    } catch (error: any) {
      console.error(error);
      let errorMessage = language === 'hi' ? "रीसेट ईमेल भेजने में विफल" : "Failed to send reset email";
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = language === 'hi' ? "इस ईमेल से कोई अकाउंट नहीं मिला" : "No account found with this email";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = language === 'hi' ? "गलत ईमेल फॉर्मेट" : "Invalid email format";
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
            {language === 'hi' ? 'पासवर्ड रीसेट करें' : 'Reset Password'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            {emailSent 
              ? (language === 'hi' ? "पासवर्ड रीसेट निर्देशों के लिए अपना ईमेल चेक करें" : "Check your email for password reset instructions")
              : (language === 'hi' ? "अपना ईमेल दर्ज करें और हम आपको पासवर्ड रीसेट करने का लिंक भेजेंगे" : "Enter your email and we'll send you a link to reset your password")
            }
          </p>
        </div>
        
        {!emailSent ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
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
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  {language === 'hi' ? 'भेजा जा रहा है...' : 'Sending...'}
                </span>
              ) : (
                language === 'hi' ? 'रीसेट लिंक भेजें' : 'Send Reset Link'
              )}
            </Button>
          </form>
        ) : (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setEmailSent(false)}
          >
            {language === 'hi' ? 'फिर से भेजें' : 'Send Again'}
          </Button>
        )}
        
        <div className="text-center">
          <Link to="/login" className="text-sm flex items-center justify-center gap-1 text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
            <ArrowLeft size={14} />
            {language === 'hi' ? 'साइन इन पर वापस जाएं' : 'Back to Sign In'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
