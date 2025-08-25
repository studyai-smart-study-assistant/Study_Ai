
import React from 'react';
import { cn } from "@/lib/utils";

interface ColorSelectorProps {
  colorOptions: string[];
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

const ColorSelector: React.FC<ColorSelectorProps> = ({
  colorOptions,
  selectedColor,
  onColorSelect
}) => {
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-2">
        {colorOptions.map((color, idx) => (
          <button
            key={color}
            type="button"
            aria-label={`Select color ${idx + 1}`}
            className={`w-8 h-8 rounded-full border-2 ${selectedColor === color ? 'border-purple-600 scale-110' : 'border-gray-200'} ${color} transition`}
            onClick={() => onColorSelect(color)}
          />
        ))}
      </div>
    </div>
  );
};

export default ColorSelector;
