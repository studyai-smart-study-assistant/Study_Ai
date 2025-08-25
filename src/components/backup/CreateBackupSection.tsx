
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Upload } from 'lucide-react';

interface CreateBackupSectionProps {
  isCreatingBackup: boolean;
  onCreateBackup: () => void;
}

export const CreateBackupSection: React.FC<CreateBackupSectionProps> = ({
  isCreatingBackup,
  onCreateBackup
}) => {
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Upload className="h-5 w-5 text-green-500" />
          {t('createNewBackup')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          {t('backupAllData')}
        </p>
        <Button 
          onClick={onCreateBackup} 
          disabled={isCreatingBackup}
          className="bg-green-500 hover:bg-green-600"
        >
          {isCreatingBackup ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              {t('creatingBackup')}
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              {t('createBackup')}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
