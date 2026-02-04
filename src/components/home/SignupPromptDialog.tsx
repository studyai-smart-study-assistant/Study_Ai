
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, UserPlus, Gift, Shield, Cloud } from 'lucide-react';
import { markSignupPromptDismissed } from '@/utils/guestUsageTracker';

interface SignupPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SignupPromptDialog: React.FC<SignupPromptDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const navigate = useNavigate();

  const handleSignup = () => {
    onOpenChange(false);
    navigate('/signup');
  };

  const handleLogin = () => {
    onOpenChange(false);
    navigate('/login');
  };

  const handleDismiss = () => {
    markSignupPromptDismissed();
    onOpenChange(false);
  };

  const benefits = [
    { icon: Cloud, text: 'Save progress across devices' },
    { icon: Shield, text: 'Secure data backup' },
    { icon: Gift, text: 'Get bonus credits' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-xl">Enjoying Study AI?</DialogTitle>
          <DialogDescription className="text-base">
            Create a free account to unlock more features and save your progress.
          </DialogDescription>
        </DialogHeader>

        {/* Benefits list */}
        <div className="space-y-2 py-4">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-3 text-sm text-muted-foreground">
              <benefit.icon className="w-4 h-4 text-primary" />
              <span>{benefit.text}</span>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <Button 
            onClick={handleSignup} 
            className="w-full h-12 text-base gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Create Free Account
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleLogin}
            className="w-full h-12 text-base"
          >
            Already have an account? Login
          </Button>

          <Button 
            variant="ghost" 
            onClick={handleDismiss}
            className="w-full text-muted-foreground"
          >
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignupPromptDialog;
