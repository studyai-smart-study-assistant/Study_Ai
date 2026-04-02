
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Trophy, UserPlus } from 'lucide-react';

interface SignupPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SignupPromptDialog: React.FC<SignupPromptDialogProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-6 h-6 text-primary" />
            Unlock the Full Experience
          </DialogTitle>
          <DialogDescription className="pt-2">
            You've reached the guest chat limit. Create a free account to continue learning and unlock powerful features.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                <Trophy className="w-5 h-5 text-yellow-500 mt-1" />
                <div>
                    <h4 className="font-semibold">View Your Rank</h4>
                    <p className="text-sm text-muted-foreground">Compete with other students and climb the leaderboard.</p>
                </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                <UserPlus className="w-5 h-5 text-green-500 mt-1" />
                <div>
                    <h4 className="font-semibold">Unlimited Chats & History</h4>
                    <p className="text-sm text-muted-foreground">Never lose a conversation and chat without limits.</p>
                </div>
            </div>
        </div>

        <DialogFooter className="sm:justify-start gap-2">
          <Button onClick={() => handleNavigation('/signup')} className="w-full sm:w-auto">Create Free Account</Button>
          <Button variant="outline" onClick={() => handleNavigation('/login')} className="w-full sm:w-auto">Login</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SignupPromptDialog;
