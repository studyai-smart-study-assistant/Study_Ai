
import React from 'react';
import { MessageSquare, Users, User } from 'lucide-react';

interface Props {
  activeTab: 'chats' | 'users' | 'groups';
  onTabChange: (tab: 'chats' | 'users' | 'groups') => void;
}

const tabs = [
  { id: 'chats' as const, icon: MessageSquare, label: 'Chats' },
  { id: 'users' as const, icon: Users, label: 'Users' },
  { id: 'groups' as const, icon: User, label: 'Account' },
];

const CampusTalkBottomNav: React.FC<Props> = ({ activeTab, onTabChange }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="flex items-center justify-around py-2">
        {tabs.map(({ id, icon: Icon, label }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 transition-colors ${
                isActive 
                  ? 'text-[hsl(230,70%,55%)]' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CampusTalkBottomNav;
