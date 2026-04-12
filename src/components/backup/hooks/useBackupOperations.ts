
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { googleDriveService } from '@/services/googleDriveService';
import { BackupData, BackupFile } from '../types';
import { chatDB } from '@/lib/db';

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

      const backupData: BackupData = {
        studyData: {
          studySessions: localStorage.getItem(`${currentUser.uid}_study_sessions`) || '0',
          totalStudyTime: localStorage.getItem(`${currentUser.uid}_total_study_time`) || '0',
          points: localStorage.getItem(`${currentUser.uid}_points`) || '0',
          level: localStorage.getItem(`${currentUser.uid}_level`) || '1',
          timerSettings: {
            soundEnabled: localStorage.getItem(`${currentUser.uid}_timer_sound`) || 'true',
            breakTime: localStorage.getItem(`${currentUser.uid}_break_time`) || '5',
          }
        },
        userProfile: {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          category: localStorage.getItem('userCategory') || '',
          educationLevel: localStorage.getItem('educationLevel') || '',
        },
        chatHistory,
        timerStats: {
          dailyGoals: localStorage.getItem(`${currentUser.uid}_daily_goals`) || '{}',
          weeklyProgress: localStorage.getItem(`${currentUser.uid}_weekly_progress`) || '{}',
        },
        achievements: JSON.parse(localStorage.getItem(`${currentUser.uid}_achievements`) || '[]'),
        savedMessages: JSON.parse(localStorage.getItem('saved_messages') || '[]'),
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
        if (backupData.studyData) {
          localStorage.setItem(`${currentUser.uid}_study_sessions`, backupData.studyData.studySessions);
          localStorage.setItem(`${currentUser.uid}_total_study_time`, backupData.studyData.totalStudyTime);
          localStorage.setItem(`${currentUser.uid}_points`, backupData.studyData.points || '0');
          localStorage.setItem(`${currentUser.uid}_level`, backupData.studyData.level || '1');
          if (backupData.studyData.timerSettings) {
            localStorage.setItem(`${currentUser.uid}_timer_sound`, backupData.studyData.timerSettings.soundEnabled);
            localStorage.setItem(`${currentUser.uid}_break_time`, backupData.studyData.timerSettings.breakTime);
          }
        }
        
        if (backupData.userProfile) {
          localStorage.setItem('userCategory', backupData.userProfile.category || '');
          localStorage.setItem('educationLevel', backupData.userProfile.educationLevel || '');
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
          localStorage.setItem(`${currentUser.uid}_daily_goals`, backupData.timerStats.dailyGoals);
          localStorage.setItem(`${currentUser.uid}_weekly_progress`, backupData.timerStats.weeklyProgress);
        }
        
        if (backupData.achievements) {
          localStorage.setItem(`${currentUser.uid}_achievements`, JSON.stringify(backupData.achievements));
        }

        if (backupData.savedMessages) {
          localStorage.setItem('saved_messages', JSON.stringify(backupData.savedMessages));
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
