
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { LockKeyhole, LogIn, UserPlus, Gift, Award } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface MessageLimitAlertProps {
  onClose: () => void;
}

const MessageLimitAlert: React.FC<MessageLimitAlertProps> = ({ onClose }) => {
  return (
    <Dialog defaultOpen={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md border-purple-200 bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-purple-950 shadow-xl animate-in fade-in-50 slide-in-from-top-5 duration-300">
        <DialogHeader className="space-y-3 text-center sm:text-center">
          <div className="mx-auto bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full p-3 w-16 h-16 flex items-center justify-center shadow-lg">
            <LockKeyhole className="h-8 w-8 text-white" />
          </div>
          
          <DialogTitle className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
            मैसेज लिमिट पूरी हो गई
          </DialogTitle>
          
          <DialogDescription className="text-gray-700 dark:text-gray-300">
            Study AI के साथ चैट जारी रखने के लिए कृपया लॉगिन करें या नया अकाउंट बनाएं
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-100 dark:border-purple-800">
            <h4 className="font-medium flex items-center gap-2 text-purple-800 dark:text-purple-300 mb-2">
              <Gift className="h-4 w-4" />
              लॉगिन के फायदे
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-500"></span>
                <span>असीमित चैट और अध्ययन संसाधन</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-500"></span>
                <span>अध्ययन प्रगति और XP पॉइंट्स का ट्रैक</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-500"></span>
                <span>लीडरबोर्ड पर रैंकिंग और बैज</span>
              </li>
            </ul>
          </div>
          
          <div className="text-center">
            <span className="inline-flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
              <Award className="h-3 w-3" />
              <span>अभी लॉगिन करने पर 50 बोनस XP पॉइंट्स!</span>
            </span>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full sm:w-auto border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/30"
          >
            बाद में
          </Button>
          
          <Button 
            asChild
            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            <Link to="/login">
              <LogIn className="h-4 w-4 mr-2" />
              लॉगिन करें
            </Link>
          </Button>
          
          <Button
            variant="secondary"
            asChild
            className="w-full sm:w-auto bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 dark:from-indigo-900/40 dark:to-purple-900/40"
          >
            <Link to="/signup">
              <UserPlus className="h-4 w-4 mr-2" />
              रजिस्टर करें
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MessageLimitAlert;
