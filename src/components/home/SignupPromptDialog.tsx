
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
import { Sparkles, UserPlus } from 'lucide-react';

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-xl">Sign up to continue</DialogTitle>
          <DialogDescription className="text-base">
            Create a free account to access all features and save your progress.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-4">
          <Button 
            onClick={handleSignup} 
            className="w-full h-12 text-base gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Create Account
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
            onClick={() => onOpenChange(false)}
            className="w-full text-muted-foreground"
          >
            Continue as Guest
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignupPromptDialog;
