
import React from 'react';
import { Button } from "@/components/ui/button";
import { Settings2, Clock, Bell, Radio } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";

interface TimerSettingsProps {
  soundEnabled: boolean;
  onSoundToggle: () => void;
  onTimerDurationChange: (minutes: number) => void;
  onBreakDurationChange: (minutes: number) => void;
}

export const TimerSettings: React.FC<TimerSettingsProps> = ({
  soundEnabled,
  onSoundToggle,
  onTimerDurationChange,
  onBreakDurationChange
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>टाइमर सेटिंग</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Clock className="mr-2 h-4 w-4" />
            <span>अध्ययन समय</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem onSelect={() => onTimerDurationChange(15)}>15 मिनट</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onTimerDurationChange(25)}>25 मिनट</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onTimerDurationChange(45)}>45 मिनट</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onTimerDurationChange(60)}>60 मिनट</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Clock className="mr-2 h-4 w-4" />
            <span>ब्रेक समय</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem onSelect={() => onBreakDurationChange(3)}>3 मिनट</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onBreakDurationChange(5)}>5 मिनट</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onBreakDurationChange(10)}>10 मिनट</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onBreakDurationChange(15)}>15 मिनट</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onSelect={onSoundToggle}>
          {soundEnabled ? (
            <>
              <Bell className="mr-2 h-4 w-4" />
              <span>ध्वनि बंद करें</span>
            </>
          ) : (
            <>
              <Radio className="mr-2 h-4 w-4" />
              <span>ध्वनि चालू करें</span>
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

