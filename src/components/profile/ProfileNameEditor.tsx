import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2, Check, X } from 'lucide-react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';

interface ProfileNameEditorProps {
  currentName: string;
  onNameUpdate: (newName: string) => void;
}

const ProfileNameEditor: React.FC<ProfileNameEditorProps> = ({
  currentName,
  onNameUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(currentName);
  const [isUpdating, setIsUpdating] = useState(false);
  const { currentUser } = useAuth();

  const handleSave = async () => {
    if (!currentUser || !newName.trim()) return;

    if (newName.trim() === currentName) {
      setIsEditing(false);
      return;
    }

    try {
      setIsUpdating(true);

      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: currentUser.uid,
          display_name: newName.trim(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      onNameUpdate(newName.trim());
      setIsEditing(false);
      toast.success('नाम सफलतापूर्वक अपडेट हो गया!');
    } catch (error) {
      console.error('Error updating name:', error);
      toast.error('नाम अपडेट करने में समस्या हुई');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setNewName(currentName);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 mt-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="h-9 text-base"
          placeholder="अपना नाम दर्ज करें"
          disabled={isUpdating}
          maxLength={50}
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-9 w-9 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
          onClick={handleSave}
          disabled={isUpdating || !newName.trim()}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          onClick={handleCancel}
          disabled={isUpdating}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-2">
      <Button
        size="sm"
        variant="outline"
        className="h-8"
        onClick={() => setIsEditing(true)}
      >
        <Edit2 className="h-3 w-3 mr-1" />
        नाम बदलें
      </Button>
    </div>
  );
};

export default ProfileNameEditor;