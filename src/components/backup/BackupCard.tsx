
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Database, Shield, Cloud } from 'lucide-react';
import { BackupDialog } from './BackupDialog';

const BackupCard: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <>
      <Card className="border-blue-200 dark:border-blue-700 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Database className="h-5 w-5" />
            {t('backupRestore')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('backupDescription')}
          </p>
          
          <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
            <Shield className="h-3 w-3" />
            <span>{t('encryptedStorage')}</span>
          </div>
          
          <Button 
            onClick={() => setIsOpen(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Cloud className="h-4 w-4 mr-2" />
            {t('openBackupRestore')}
          </Button>
        </CardContent>
      </Card>

      <BackupDialog isOpen={isOpen} onOpenChange={setIsOpen} />
    </>
  );
};

export default BackupCard;
