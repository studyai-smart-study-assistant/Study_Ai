
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '@/lib/firebase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, Globe } from 'lucide-react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getUserInitials, getAvatarColor } from '@/components/leaderboard/utils/avatarUtils';
import { useLanguage } from '@/contexts/LanguageContext';

const educationLevels = [
  { value: "class-1-5", labelEn: "Class 1-5", labelHi: "कक्षा 1-5" },
  { value: "class-6-8", labelEn: "Class 6-8", labelHi: "कक्षा 6-8" },
  { value: "class-9-10", labelEn: "Class 9-10", labelHi: "कक्षा 9-10" },
  { value: "class-11-12", labelEn: "Class 11-12", labelHi: "कक्षा 11-12" },
  { value: "undergraduate", labelEn: "Undergraduate", labelHi: "स्नातक" },
  { value: "postgraduate", labelEn: "Postgraduate", labelHi: "स्नातकोत्तर" },
  { value: "other", labelEn: "Other", labelHi: "अन्य" }
];

const userCategories = [
  { value: "student", labelEn: "Student", labelHi: "छात्र" },
  { value: "teacher", labelEn: "Teacher", labelHi: "शिक्षक" },
  { value: "personal", labelEn: "Personal Use", labelHi: "व्यक्तिगत उपयोग" },
  { value: "business", labelEn: "Business", labelHi: "व्यापार" },
  { value: "other", labelEn: "Other", labelHi: "अन्य" }
];

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userCategory, setUserCategory] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();

  const userInitials = getUserInitials(name || 'User');
  const avatarColor = getAvatarColor(email || 'default');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password || !confirmPassword || !userCategory || !educationLevel) {
      toast.error(language === 'hi' ? "कृपया सभी आवश्यक फ़ील्ड भरें" : "Please fill in all required fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error(language === 'hi' ? "पासवर्ड मैच नहीं कर रहे" : "Passwords do not match");
      return;
    }
    
    if (password.length < 6) {
      toast.error(language === 'hi' ? "पासवर्ड कम से कम 6 अक्षर का होना चाहिए" : "Password must be at least 6 characters long");
      return;
    }
    
    try {
      setIsLoading(true);
      await registerUser(email, password, name, userCategory, educationLevel, referralCode);
      
      toast.success(language === 'hi' ? "अकाउंट सफलतापूर्वक बन गया!" : "Account created successfully!");
      navigate('/');
    } catch (error: any) {
      console.error(error);
      let errorMessage = language === 'hi' ? "रजिस्ट्रेशन विफल" : "Registration failed";
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = language === 'hi' ? "यह ईमेल पहले से उपयोग में है" : "Email already in use";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = language === 'hi' ? "गलत ईमेल फॉर्मेट" : "Invalid email format";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = language === 'hi' ? "पासवर्ड बहुत कमजोर है" : "Password is too weak";
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-900 dark:to-purple-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6 mb-8">
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
            {language === 'hi' ? 'अकाउंट बनाएं' : 'Create Account'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {language === 'hi' ? 'अपनी पढ़ाई बेहतर बनाने के लिए Study AI से जुड़ें' : 'Join Study AI to enhance your learning'}
          </p>
        </div>
        
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="flex flex-col items-center mb-4">
            <Avatar className="w-20 h-20 mb-2 shadow-lg border-2 border-white">
              <AvatarFallback className={`${avatarColor} text-lg font-bold relative overflow-hidden flex items-center justify-center`}>
                <span className="relative z-10 text-white font-black select-none" style={{ 
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 6px rgba(0,0,0,0.4)',
                  letterSpacing: '1px'
                }}>
                  {userInitials}
                </span>
              </AvatarFallback>
            </Avatar>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {language === 'hi' ? 'आपका प्रोफाइल लोगो' : 'Your profile logo'}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">
              {language === 'hi' ? 'पूरा नाम' : 'Full Name'}
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={language === 'hi' ? "आपका पूरा नाम" : "Your full name"}
              required
            />
          </div>
          
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
            <Label htmlFor="password">
              {language === 'hi' ? 'नया पासवर्ड बनाएं' : 'Create Password'}
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <p className="text-xs text-gray-500">
              {language === 'hi' ? 'कम से कम 6 अक्षर होना चाहिए' : 'Must be at least 6 characters'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              {language === 'hi' ? 'पासवर्ड कन्फर्म करें' : 'Confirm Password'}
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">
              {language === 'hi' ? 'मैं हूं' : 'I am a'}
            </Label>
            <Select 
              value={userCategory}
              onValueChange={setUserCategory}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder={language === 'hi' ? "श्रेणी चुनें" : "Select category"} />
              </SelectTrigger>
              <SelectContent>
                {userCategories.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {language === 'hi' ? category.labelHi : category.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="education">
              {language === 'hi' ? 'शिक्षा स्तर' : 'Education Level'}
            </Label>
            <Select 
              value={educationLevel}
              onValueChange={setEducationLevel}
            >
              <SelectTrigger id="education">
                <SelectValue placeholder={language === 'hi' ? "शिक्षा स्तर चुनें" : "Select education level"} />
              </SelectTrigger>
              <SelectContent>
                {educationLevels.map(level => (
                  <SelectItem key={level.value} value={level.value}>
                    {language === 'hi' ? level.labelHi : level.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="referralCode">
              {language === 'hi' ? 'रेफरल कोड (वैकल्पिक)' : 'Referral Code (Optional)'}
            </Label>
            <Input
              id="referralCode"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              placeholder={language === 'hi' ? "जैसे: REF12345678" : "e.g., REF12345678"}
            />
            <p className="text-xs text-gray-500">
              {language === 'hi' 
                ? '✨ रेफरल कोड से आपको 200 बोनस पॉइंट्स मिलेंगे!' 
                : '✨ Get 200 bonus points with referral code!'}
            </p>
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center justify-center">
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                {language === 'hi' ? 'अकाउंट बनाया जा रहा है...' : 'Creating account...'}
              </span>
            ) : (
              language === 'hi' ? 'अकाउंट बनाएं' : 'Create Account'
            )}
          </Button>
        </form>
        
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          {language === 'hi' ? 'पहले से अकाउंट है?' : 'Already have an account?'}{" "}
          <Link to="/login" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 font-medium">
            {language === 'hi' ? 'साइन इन करें' : 'Sign in'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
