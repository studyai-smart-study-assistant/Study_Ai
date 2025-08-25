
import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { Cloud } from 'lucide-react';
import { CreateBackupSection } from './CreateBackupSection';
import { RestoreBackupSection } from './RestoreBackupSection';
import { BackupInfoSection } from './BackupInfoSection';
import { useBackupOperations } from './hooks/useBackupOperations';

interface BackupDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BackupDialog: React.FC<BackupDialogProps> = ({ isOpen, onOpenChange }) => {
  const { t } = useLanguage();
  const backupOperations = useBackupOperations();

  useEffect(() => {
    if (isOpen) {
      backupOperations.loadBackups();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-blue-500" />
            {t('googleDriveBackupSystem')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <CreateBackupSection
            isCreatingBackup={backupOperations.isCreatingBackup}
            onCreateBackup={backupOperations.createBackup}
          />

          <RestoreBackupSection
            backups={backupOperations.backups}
            isLoading={backupOperations.isLoading}
            onRestoreBackup={backupOperations.restoreBackup}
            onDeleteBackup={backupOperations.deleteBackup}
          />

          <BackupInfoSection />
        </div>
      </DialogContent>
    </Dialog>
  );
};
