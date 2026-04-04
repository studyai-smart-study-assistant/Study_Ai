
interface BackupData {
  studyData: Record<string, unknown>;
  userProfile: Record<string, unknown>;
  chatHistory: unknown[];
  timerStats: Record<string, unknown>;
  achievements: unknown[];
  timestamp: string;
}

interface OAuthTokenResponse {
  access_token?: string;
  error?: unknown;
}

interface GoogleTokenClient {
  requestAccessToken: () => void;
}

interface DriveListResponse {
  files?: DriveBackupFile[];
}

interface DriveBackupFile {
  id: string;
  name: string;
  createdTime?: string;
  size?: string;
}

interface GoogleWindow extends Window {
  google?: {
    accounts?: {
      oauth2?: {
        initTokenClient: (config: {
          client_id: string;
          scope: string;
          callback: (tokenResponse: OAuthTokenResponse) => void;
        }) => GoogleTokenClient;
      };
    };
  };
}

class GoogleDriveService {
  private CLIENT_ID = '556004873116-dn8d6qlu83a9r2vgg2lq655pkaamtc3u.apps.googleusercontent.com';
  private SCOPES = ['https://www.googleapis.com/auth/drive.file'];
  private accessToken: string | null = null;

  async authenticate(): Promise<boolean> {
    try {
      const response = await new Promise<OAuthTokenResponse>((resolve, reject) => {
        (window as GoogleWindow).google?.accounts?.oauth2?.initTokenClient({
          client_id: this.CLIENT_ID,
          scope: this.SCOPES.join(' '),
          callback: (tokenResponse) => {
            if (tokenResponse.error) reject(tokenResponse);
            else resolve(tokenResponse);
          },
        }).requestAccessToken();
      });
      this.accessToken = response.access_token ?? null;
      return true;
    } catch (error: unknown) {
      console.warn('Google Drive auth failed', error);
      return false;
    }
  }

  async createBackup(data: BackupData): Promise<string | null> {
    if (!this.accessToken && !await this.authenticate()) return null;
    try {
      const fileName = `StudyAI_Backup_${new Date().toISOString().split('T')[0]}.json`;
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify({ name: fileName, parents: ['appDataFolder'] })], { type: 'application/json' }));
      form.append('file', new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', { method: 'POST', headers: { Authorization: `Bearer ${this.accessToken}` }, body: form });
      if (response.ok) return (await response.json()).id;
      return null;
    } catch (error: unknown) {
      console.warn('Google Drive backup creation failed', error);
      return null;
    }
  }

  async listBackups(): Promise<DriveBackupFile[]> {
    if (!this.accessToken && !await this.authenticate()) return [];
    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=name contains 'StudyAI_Backup' and parents in 'appDataFolder'&fields=files(id,name,createdTime,size)`, { headers: { Authorization: `Bearer ${this.accessToken}` } });
      if (response.ok) {
        const listResponse = (await response.json()) as DriveListResponse;
        return listResponse.files || [];
      }
      return [];
    } catch (error: unknown) {
      console.warn('Google Drive list backups failed', error);
      return [];
    }
  }

  async restoreBackup(fileId: string): Promise<BackupData | null> {
    if (!this.accessToken && !await this.authenticate()) return null;
    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, { headers: { Authorization: `Bearer ${this.accessToken}` } });
      if (response.ok) return await response.json() as BackupData;
      return null;
    } catch (error: unknown) {
      console.warn('Google Drive restore backup failed', error);
      return null;
    }
  }

  async deleteBackup(fileId: string): Promise<boolean> {
    if (!this.accessToken && !await this.authenticate()) return false;
    try {
      return (await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${this.accessToken}` } })).ok;
    } catch (error: unknown) {
      console.warn('Google Drive delete backup failed', error);
      return false;
    }
  }
}

export const googleDriveService = new GoogleDriveService();
