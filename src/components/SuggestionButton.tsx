
import React, { ReactNode } from 'react';
import { cn } from "@/lib/utils";

interface SuggestionButtonProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
}

const SuggestionButton: React.FC<SuggestionButtonProps> = ({
  icon,
  label,
  onClick,
  className
}) => {
  return (
    <button
      className={cn(
        "flex items-center gap-2 px-4 py-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors text-sm",
        className
      )}
      onClick={onClick}
    >
      <div className="text-gray-600">{icon}</div>
      <span className="text-gray-700">{label}</span>
    </button>
  );
};

export default SuggestionButton;
