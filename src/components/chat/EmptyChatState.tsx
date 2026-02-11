
import React from 'react';
import { FileText, BookOpen, ClipboardList, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyChatStateProps {
  onSendMessage: (message: string) => void;
}

const suggestions = [
  { icon: FileText, label: 'Notes बनाएं', message: 'Help me create detailed study notes', color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  { icon: BookOpen, label: 'Quiz बनाएं', message: 'Generate a quiz on my topic', color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
  { icon: ClipboardList, label: 'Homework Help', message: 'Help me with my homework', color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  { icon: GraduationCap, label: 'कुछ सिखाओ', message: 'Teach me about quantum physics in simple terms', color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
];

const EmptyChatState: React.FC<EmptyChatStateProps> = ({ onSendMessage }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
      <h2 className="text-lg font-medium text-foreground mb-6">
        कुछ भी पूछें — मैं आपकी मदद करूँगा! 🎓
      </h2>
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {suggestions.map((item) => (
          <button
            key={item.label}
            onClick={() => onSendMessage(item.message)}
            className={cn(
              "flex flex-col items-center gap-2 px-4 py-4 rounded-2xl transition-colors text-center",
              item.bg,
              "hover:opacity-80 active:scale-95 transition-all"
            )}
          >
            <item.icon className={cn("w-6 h-6", item.color)} />
            <span className="text-xs font-medium text-foreground">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmptyChatState;
