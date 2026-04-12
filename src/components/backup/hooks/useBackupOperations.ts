
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { googleDriveService } from '@/services/googleDriveService';
import { BackupData, BackupFile } from '../types';
import { chatDB } from '@/lib/db';
import { supabase } from '@/integrations/supabase/client';
import { safeInvokeWithAuthRetry } from '@/lib/auth/sessionRecovery';

const getTimerUiSettings = (userId: string) => ({
  soundEnabled: localStorage.getItem(`${userId}_timer_sound`) || 'true',
  breakTime: localStorage.getItem(`${userId}_break_time`) || '5',
});

export const useBackupOperations = () => {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  const loadBackups = async () => {
    setIsLoading(true);
    try {
      const backupList = await googleDriveService.listBackups();
      setBackups(backupList);
    } catch (error) {
      toast.error(t('failedToLoadBackupList'));
    } finally {
      setIsLoading(false);
    }
  };

  const createBackup = async () => {
    if (!currentUser) {
      toast.error(t('pleaseLoginToCreateBackup'));
      return;
    }

    setIsCreatingBackup(true);
    try {
      const chatHistory = await chatDB.getAllChats();
      const [{ data: profileData }, { data: pointsData }, { data: transactionsData }, { data: memoryData }] = await Promise.all([
        supabase
          .from('profiles')
          .select('user_category, education_level')
          .eq('user_id', currentUser.uid)
          .maybeSingle(),
        safeInvokeWithAuthRetry(
          (body) => supabase.functions.invoke('points-balance', { body }),
          { userId: currentUser.uid }
        ),
        supabase
          .from('points_transactions')
          .select('id, reason, amount, transaction_type, created_at, metadata')
          .eq('user_id', currentUser.uid)
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('user_memories')
          .select('memory_key, memory_value, updated_at')
          .eq('user_id', currentUser.uid)
          .in('memory_key', ['daily_goals', 'weekly_progress', 'saved_messages'])
      ]);

      const memoryByKey = new Map((memoryData ?? []).map((item) => [item.memory_key, item.memory_value]));
      const safeJsonArray = (value: string | undefined) => {
        if (!value) return [];
        try {
          const parsed = JSON.parse(value) as unknown;
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      };

      const backupData: BackupData = {
        studyData: {
          studySessions: '0',
          totalStudyTime: '0',
          points: (pointsData?.balance ?? 0).toString(),
          level: (pointsData?.level ?? 1).toString(),
          timerSettings: getTimerUiSettings(currentUser.uid),
        },
        userProfile: {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          category: profileData?.user_category || '',
          educationLevel: profileData?.education_level || '',
        },
        chatHistory,
        timerStats: {
          dailyGoals: memoryByKey.get('daily_goals') || '{}',
          weeklyProgress: memoryByKey.get('weekly_progress') || '{}',
        },
        achievements: (transactionsData ?? []).filter((entry) =>
          ['achievement', 'goal_completed', 'streak', 'quiz'].includes(entry.transaction_type)
        ),
        savedMessages: safeJsonArray(memoryByKey.get('saved_messages')),
        timestamp: new Date().toISOString(),
        version: '1.0',
      };

      const backupId = await googleDriveService.createBackup(backupData);
      
      if (backupId) {
        toast.success(`✅ ${t('backupCreatedSuccessfully')}`);
        loadBackups();
      } else {
        toast.error(`❌ ${t('failedToCreateBackup')}`);
      }
    } catch (error) {
      console.error('Backup creation error:', error);
      toast.error(`❌ ${t('errorCreatingBackup')}`);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const restoreBackup = async (fileId: string, fileName: string) => {
    if (!currentUser) return;

    try {
      const backupData = await googleDriveService.restoreBackup(fileId) as BackupData;
      
      if (backupData) {
        if (backupData.studyData?.timerSettings) {
          localStorage.setItem(`${currentUser.uid}_timer_sound`, backupData.studyData.timerSettings.soundEnabled);
          localStorage.setItem(`${currentUser.uid}_break_time`, backupData.studyData.timerSettings.breakTime);
        }
        
        if (backupData.userProfile) {
          await supabase
            .from('profiles')
            .update({
              user_category: backupData.userProfile.category || null,
              education_level: backupData.userProfile.educationLevel || null,
            })
            .eq('user_id', currentUser.uid);
        }
        
        if (Array.isArray(backupData.chatHistory)) {
          const existingChats = await chatDB.getAllChats();
          await Promise.all(existingChats.map((chat) => chatDB.deleteChat(chat.id)));
          await Promise.all(
            backupData.chatHistory.map(async (chat: any) => {
              if (!chat?.id || !Array.isArray(chat?.messages)) return;
              await chatDB.saveChat({
                id: chat.id,
                title: chat.title || 'Restored Chat',
                timestamp: typeof chat.timestamp === 'number' ? chat.timestamp : Date.now(),
                messages: chat.messages,
              });
            })
          );
        }
        
        if (backupData.timerStats) {
          const memoryRows = [
            { user_id: currentUser.uid, memory_key: 'daily_goals', memory_value: backupData.timerStats.dailyGoals || '{}', category: 'preferences', source: 'backup_restore' },
            { user_id: currentUser.uid, memory_key: 'weekly_progress', memory_value: backupData.timerStats.weeklyProgress || '{}', category: 'preferences', source: 'backup_restore' },
          ];
          await supabase.from('user_memories').upsert(memoryRows, { onConflict: 'user_id,memory_key' });
        }

        if (Array.isArray(backupData.savedMessages)) {
          await supabase.from('user_memories').upsert(
            {
              user_id: currentUser.uid,
              memory_key: 'saved_messages',
              memory_value: JSON.stringify(backupData.savedMessages),
              category: 'preferences',
              source: 'backup_restore',
            },
            { onConflict: 'user_id,memory_key' }
          );
        }

        toast.success(`✅ ${t('dataRestoredFrom')} ${fileName}!`);
        window.location.reload();
      } else {
        toast.error(`❌ ${t('failedToRestoreBackup')}`);
      }
    } catch (error) {
      console.error('Restore error:', error);
      toast.error(`❌ ${t('errorRestoringBackup')}`);
    }
  };

  const deleteBackup = async (fileId: string, fileName: string) => {
    try {
      const success = await googleDriveService.deleteBackup(fileId);
      if (success) {
        toast.success(`🗑️ ${fileName} ${t('backupDeleted')}`);
        loadBackups();
      } else {
        toast.error(`❌ ${t('failedToDeleteBackup')}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(`❌ ${t('errorDeletingBackup')}`);
    }
  };

  return {
    backups,
    isLoading,
    isCreatingBackup,
    loadBackups,
    createBackup,
    restoreBackup,
    deleteBackup
  };
};
