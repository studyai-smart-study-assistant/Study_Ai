import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Lock, Eye, EyeOff, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const { language } = useLanguage();

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error(language === 'hi' ? 'सभी फ़ील्ड भरें' : 'Please fill all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(language === 'hi' ? 'नया पासवर्ड मैच नहीं कर रहा' : 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error(language === 'hi' ? 'पासवर्ड कम से कम 6 अक्षर का होना चाहिए' : 'Password must be at least 6 characters');
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success(language === 'hi' ? 'पासवर्ड बदल दिया गया! ✅' : 'Password changed successfully! ✅');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || (language === 'hi' ? 'पासवर्ड बदलने में दिक्कत आई' : 'Failed to change password'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" />
          {language === 'hi' ? 'पासवर्ड बदलें' : 'Change Password'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="space-y-2">
            <Label>{language === 'hi' ? 'नया पासवर्ड' : 'New Password'}</Label>
            <div className="relative">
              <Input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={language === 'hi' ? 'नया पासवर्ड डालें' : 'Enter new password'}
                className="pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setShowNew(!showNew)}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{language === 'hi' ? 'पासवर्ड कन्फर्म करें' : 'Confirm New Password'}</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={language === 'hi' ? 'दोबारा पासवर्ड डालें' : 'Confirm new password'}
              required
            />
            {confirmPassword && newPassword === confirmPassword && (
              <p className="text-xs text-green-500 flex items-center gap-1"><Check className="h-3 w-3" /> {language === 'hi' ? 'पासवर्ड मैच हो रहा है' : 'Passwords match'}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                {language === 'hi' ? 'बदला जा रहा है...' : 'Changing...'}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                {language === 'hi' ? 'पासवर्ड बदलें' : 'Change Password'}
              </span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ChangePassword;
