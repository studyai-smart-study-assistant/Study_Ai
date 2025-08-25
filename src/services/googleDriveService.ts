
import { auth } from '@/lib/firebase/config';

interface BackupData {
  studyData: any;
  userProfile: any;
  chatHistory: any;
  timerStats: any;
  achievements: any;
  timestamp: string;
}

class GoogleDriveService {
  private CLIENT_ID = '556004873116-dn8d6qlu83a9r2vgg2lq655pkaamtc3u.apps.googleusercontent.com';
  private CLIENT_SECRET = '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';
  private SCOPES = ['https://www.googleapis.com/auth/drive.file'];
  
  private accessToken: string | null = null;

  async authenticate(): Promise<boolean> {
    try {
      // Use Google Identity Services for authentication
      const response = await new Promise<any>((resolve, reject) => {
        window.google?.accounts.oauth2.initTokenClient({
          client_id: this.CLIENT_ID,
          scope: this.SCOPES.join(' '),
          callback: (tokenResponse: any) => {
            if (tokenResponse.error) {
              reject(tokenResponse);
            } else {
              resolve(tokenResponse);
            }
          },
        }).requestAccessToken();
      });

      this.accessToken = response.access_token;
      return true;
    } catch (error) {
      console.error('Google Drive authentication failed:', error);
      return false;
    }
  }

  async createBackup(data: BackupData): Promise<string | null> {
    if (!this.accessToken) {
      const authenticated = await this.authenticate();
      if (!authenticated) return null;
    }

    try {
      const fileName = `StudyAI_Backup_${new Date().toISOString().split('T')[0]}.json`;
      const fileMetadata = {
        name: fileName,
        parents: ['appDataFolder'], // Store in app's private folder
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
      form.append('file', new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: form,
      });

      if (response.ok) {
        const result = await response.json();
        return result.id;
      }
      return null;
    } catch (error) {
      console.error('Backup creation failed:', error);
      return null;
    }
  }

  async listBackups(): Promise<any[]> {
    if (!this.accessToken) {
      const authenticated = await this.authenticate();
      if (!authenticated) return [];
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name contains 'StudyAI_Backup' and parents in 'appDataFolder'&fields=files(id,name,createdTime,size)`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        return result.files || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }

  async restoreBackup(fileId: string): Promise<BackupData | null> {
    if (!this.accessToken) {
      const authenticated = await this.authenticate();
      if (!authenticated) return null;
    }

    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (response.ok) {
        const backupData = await response.json();
        return backupData;
      }
      return null;
    } catch (error) {
      console.error('Backup restore failed:', error);
      return null;
    }
  }

  async deleteBackup(fileId: string): Promise<boolean> {
    if (!this.accessToken) {
      const authenticated = await this.authenticate();
      if (!authenticated) return false;
    }

    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Backup deletion failed:', error);
      return false;
    }
  }
}

export const googleDriveService = new GoogleDriveService();
