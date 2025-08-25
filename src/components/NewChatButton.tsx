
import React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

interface NewChatButtonProps {
  onClick: () => void;
  className?: string;
}

const NewChatButton: React.FC<NewChatButtonProps> = ({ onClick, className }) => {
  return (
    <Button 
      onClick={onClick} 
      className={`w-full flex items-center gap-2 transition-all hover:scale-[1.02] ${className}`}
      variant="outline"
    >
      <PlusCircle size={18} />
      New Chat
    </Button>
  );
};

export default NewChatButton;
