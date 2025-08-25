
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export const BackupInfoSection: React.FC = () => {
  const { language, t } = useLanguage();

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
      <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-1">
        {language === 'hi' ? '📝 जानकारी:' : `📝 ${t('information')}:`}
      </h4>
      <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
        <li>• {t('backupSecurelyStores')}</li>
        <li>• {t('storedInPrivateFolder')}</li>
        <li>• {t('canRestoreAnytime')}</li>
        <li>• {t('canSyncAcrossDevices')}</li>
      </ul>
    </div>
  );
};
