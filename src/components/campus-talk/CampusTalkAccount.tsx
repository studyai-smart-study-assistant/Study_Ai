
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { User, Pencil, Check, Copy } from 'lucide-react';

const avatarColors = [
  'bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500',
  'bg-purple-500', 'bg-teal-500', 'bg-red-500', 'bg-indigo-500',
];

const getColor = (name: string) => {
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % avatarColors.length;
  return avatarColors[idx];
};

const CampusTalkAccount: React.FC = () => {
  const { currentUser } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('display_name, referral_code, avatar_url, photo_url')
        .eq('user_id', currentUser.uid)
        .maybeSingle();

      if (data) {
        setDisplayName(data.display_name || currentUser.displayName || '');
        setReferralCode(data.referral_code || '');
        setAvatarUrl(data.avatar_url || data.photo_url || currentUser.photoURL);
      } else {
        setDisplayName(currentUser.displayName || '');
        setAvatarUrl(currentUser.photoURL);
      }
    };
    load();
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser || !displayName.trim()) return;
    setSaving(true);
    try {
      // Update profiles table
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ display_name: displayName.trim(), updated_at: new Date().toISOString() })
        .eq('user_id', currentUser.uid);

      if (profileErr) throw profileErr;

      // Update campus_users table too
      await supabase
        .from('campus_users')
        .update({ display_name: displayName.trim() })
        .eq('firebase_uid', currentUser.uid);

      toast.success('नाम अपडेट हो गया! ✅');
      setEditing(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      toast.error('नाम अपडेट करने में समस्या: ' + message);
    } finally {
      setSaving(false);
    }
  };

  const copyCode = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode);
      toast.success('Code copied! 📋');
    }
  };

  const name = displayName || 'User';

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Profile Card */}
      <div className="flex flex-col items-center gap-3">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="w-20 h-20 rounded-full object-cover" />
        ) : (
          <div className={`w-20 h-20 rounded-full ${getColor(name)} flex items-center justify-center text-white font-bold text-3xl`}>
            {name.charAt(0).toUpperCase()}
          </div>
        )}

        {editing ? (
          <div className="flex items-center gap-2 w-full max-w-xs">
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="अपना नाम लिखें..."
              className="text-center"
              autoFocus
            />
            <Button size="icon" onClick={handleSave} disabled={saving || !displayName.trim()}>
              <Check className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-foreground">{name}</h2>
            <button onClick={() => setEditing(true)} className="p-1.5 rounded-full hover:bg-muted transition-colors">
              <Pencil className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        )}

        <p className="text-sm text-muted-foreground">{currentUser?.email}</p>
      </div>

      {/* Unique Code */}
      {referralCode && (
        <div className="bg-muted rounded-xl p-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your Unique Code</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-lg font-mono font-bold text-foreground bg-background rounded-lg px-3 py-2 text-center">
              {referralCode}
            </code>
            <Button size="icon" variant="outline" onClick={copyCode}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">दूसरे users इस code से आपको search कर सकते हैं</p>
        </div>
      )}

      {/* Info */}
      <div className="bg-muted/50 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-3">
          <User className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">User ID</p>
            <p className="text-sm font-mono text-foreground">{currentUser?.uid?.slice(0, 12)}...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampusTalkAccount;
