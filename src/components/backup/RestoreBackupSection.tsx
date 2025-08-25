
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { Download, CheckCircle, Trash2, AlertCircle } from 'lucide-react';
import { BackupFile } from './types';

interface RestoreBackupSectionProps {
  backups: BackupFile[];
  isLoading: boolean;
  onRestoreBackup: (fileId: string, fileName: string) => void;
  onDeleteBackup: (fileId: string, fileName: string) => void;
}

export const RestoreBackupSection: React.FC<RestoreBackupSectionProps> = ({
  backups,
  isLoading,
  onRestoreBackup,
  onDeleteBackup
}) => {
  const { language, t } = useLanguage();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(language === 'hi' ? 'hi-IN' : 'en-US');
  };

  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Download className="h-5 w-5 text-blue-500" />
          {t('restorePreviousBackup')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : backups.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            {t('noBackupsFound')}
          </div>
        ) : (
          <ScrollArea className="max-h-64">
            <div className="space-y-2">
              {backups.map((backup) => (
                <div 
                  key={backup.id} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="font-medium text-sm">{backup.name}</span>
                    </div>
                    <div className="flex gap-2 text-xs text-gray-500">
                      <Badge variant="outline">{formatDate(backup.createdTime)}</Badge>
                      <Badge variant="outline">{formatFileSize(backup.size)}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onRestoreBackup(backup.id, backup.name)}
                      className="text-blue-600 hover:bg-blue-50"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      {t('restore')}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onDeleteBackup(backup.id, backup.name)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
