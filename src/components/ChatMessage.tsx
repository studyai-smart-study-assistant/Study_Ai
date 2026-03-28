
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Clipboard, Check, Bot, User, Edit, Trash2 } from "lucide-react";
import { useUser } from '@/hooks/useUser';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { toast } from 'sonner';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
}

interface ChatMessageProps {
  message: Message;
  isLastMessage: boolean;
  onEdit: (messageId: string, newContent: string) => void;
  onDelete: (messageId: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLastMessage, onEdit, onDelete }) => {
  const { userDetails } = useUser();
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy!', err);
      toast.error("Failed to copy message.");
    });
  };

  const handleSaveEdit = () => {
    if (editedContent.trim() !== message.content) {
      onEdit(message.id, editedContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedContent(message.content);
    setIsEditing(false);
  };

  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-3 md:gap-4 my-4 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <Avatar className="h-8 w-8 border shadow-sm">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot size={20} />
          </AvatarFallback>
        </Avatar>
      )}

      <div className={`group flex flex-col gap-1 w-full max-w-xl lg:max-w-3xl ${isUser ? 'items-end' : ''}`}>
        <div className={`relative rounded-2xl px-3.5 py-2.5 ${isUser ? 'bg-primary text-primary-foreground rounded-br-lg' : 'bg-card text-card-foreground border rounded-bl-lg'}`}>
          {isEditing ? (
            <div className="space-y-2">
                <textarea 
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full bg-transparent p-0 border-0 focus:ring-0 resize-none text-sm"
                    rows={Math.max(3, editedContent.split('\n').length)}
                />
                <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={handleCancelEdit}>Cancel</Button>
                    <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                </div>
            </div>
          ) : (
            <div className="prose prose-sm text-foreground max-w-none prose-p:my-2 prose-headings:my-3 prose-pre:my-2 prose-ul:my-2 prose-ol:my-2">
              <MarkdownRenderer content={message.content} />
            </div>
          )}
          
          {message.images && message.images.length > 0 && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                  {message.images.map((img, idx) => (
                      <img key={idx} src={img} alt={`uploaded ${idx}`} className="rounded-lg object-cover" />
                  ))}
              </div>
          )}
        </div>

        {!isEditing && (
            <div className="flex items-center justify-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!isUser && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Clipboard size={14} />}
                </Button>
              )}
              {isUser && isLastMessage && (
                  <>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsEditing(true)}>
                      <Edit size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(message.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </>
              )}
            </div>
        )}
      </div>

      {isUser && (
        <Avatar className="h-8 w-8 border shadow-sm">
          <AvatarImage src={userDetails?.avatar_url || undefined} />
          <AvatarFallback className="bg-muted-foreground text-muted">
            <User size={20} />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default ChatMessage;
