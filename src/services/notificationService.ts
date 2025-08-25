
import { toast } from 'sonner';

export class NotificationService {
  static success(message: string, description?: string) {
    toast.success(message, {
      description,
      duration: 3000,
    });
  }

  static error(message: string, description?: string) {
    toast.error(message, {
      description,
      duration: 5000,
    });
  }

  static info(message: string, description?: string) {
    toast.info(message, {
      description,
      duration: 4000,
    });
  }

  static loading(message: string) {
    return toast.loading(message);
  }

  static dismiss(toastId: string | number) {
    toast.dismiss(toastId);
  }

  // Batch notifications for multiple operations
  static batch(notifications: Array<{ type: 'success' | 'error' | 'info', message: string, description?: string }>) {
    notifications.forEach(({ type, message, description }) => {
      this[type](message, description);
    });
  }
}

export default NotificationService;
