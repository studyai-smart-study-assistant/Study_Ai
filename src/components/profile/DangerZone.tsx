import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { LogOut, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential, User as FirebaseUser } from 'firebase/auth';
import { ref, remove } from 'firebase/database';
import { database } from '@/lib/firebase/config';

interface DangerZoneProps {
  currentUser: FirebaseUser;
  onLogout: () => Promise<void> | void;
}

const DangerZone: React.FC<DangerZoneProps> = ({ currentUser, onLogout }) => {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const clearLocalData = (uid: string) => {
    try {
      localStorage.removeItem(`${uid}_points`);
      localStorage.removeItem(`${uid}_level`);
      // Remove any other keys starting with uid_
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`${uid}_`)) toRemove.push(key);
      }
      toRemove.forEach((k) => localStorage.removeItem(k));
    } catch {}
  };

  const purgeSupabaseData = async (uid: string) => {
    const { error } = await supabase.functions.invoke('account-purge', {
      body: { uid },
    });
    if (error) throw error;
  };

  const handleAccountDelete = async () => {
    if (!currentUser?.uid) return;
    if (confirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    setIsDeleting(true);
    try {
      // Re-authenticate with password for security
      if (currentUser.email) {
        const cred = EmailAuthProvider.credential(currentUser.email, password);
        await reauthenticateWithCredential(currentUser, cred);
      }

      // Clean up backend data first
      await purgeSupabaseData(currentUser.uid);
      await remove(ref(database, `users/${currentUser.uid}`)).catch(() => {});
      clearLocalData(currentUser.uid);

      // Finally delete auth user
      await deleteUser(currentUser);

      toast.success('Account deleted successfully');
      setOpen(false);
      navigate('/');
    } catch (err: any) {
      if (err?.code === 'auth/requires-recent-login') {
        toast.error('Please log in again and retry account deletion');
      } else {
        toast.error('Failed to delete account');
        console.error('Delete account error:', err);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section aria-labelledby="danger-zone-heading" className="space-y-4">
      <Alert className="border-destructive/30 bg-destructive/10">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <AlertDescription className="font-medium">Danger Zone</AlertDescription>
      </Alert>

      <div className="p-4 border rounded-lg border-destructive/30 bg-destructive/5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button variant="destructive" onClick={() => onLogout()}>
            <LogOut className="mr-2 h-5 w-5" /> Log Out
          </Button>
          <Button variant="destructive" onClick={() => setOpen(true)}>
            <Trash2 className="mr-2 h-5 w-5" /> Delete Account
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              This will permanently delete your account and all associated data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Type DELETE to confirm</label>
              <input
                className="mt-2 w-full rounded-md border px-3 py-2 bg-background"
                placeholder="DELETE"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Confirm your password</label>
              <input
                type="password"
                className="mt-2 w-full rounded-md border px-3 py-2 bg-background"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleAccountDelete} disabled={isDeleting || confirmText !== 'DELETE' || !password}>
              {isDeleting ? 'Deleting…' : 'Delete Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default DangerZone;
