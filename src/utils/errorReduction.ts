// Error reduction and handling utilities

export class ErrorReduction {
  private static instance: ErrorReduction;
  private errorCounts: Map<string, number> = new Map();
  private lastErrors: Map<string, number> = new Map();

  static getInstance(): ErrorReduction {
    if (!ErrorReduction.instance) {
      ErrorReduction.instance = new ErrorReduction();
    }
    return ErrorReduction.instance;
  }

  // Reduce repetitive error logging
  logError(message: string, error?: any): boolean {
    const errorKey = message + (error?.message || '');
    const now = Date.now();
    const lastErrorTime = this.lastErrors.get(errorKey) || 0;
    
    // Only log if it's been more than 5 seconds since last similar error
    if (now - lastErrorTime > 5000) {
      this.lastErrors.set(errorKey, now);
      this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);
      
      if (process.env.NODE_ENV === 'development') {
        console.error(message, error);
      }
      return true;
    }
    return false;
  }

  // Safe async operation wrapper
  async safeAsync<T>(
    operation: () => Promise<T>,
    fallback?: T,
    errorMessage?: string
  ): Promise<T | undefined> {
    try {
      return await operation();
    } catch (error) {
      if (errorMessage) {
        this.logError(errorMessage, error);
      }
      return fallback;
    }
  }

  // Safe sync operation wrapper
  safe<T>(
    operation: () => T,
    fallback?: T,
    errorMessage?: string
  ): T | undefined {
    try {
      return operation();
    } catch (error) {
      if (errorMessage) {
        this.logError(errorMessage, error);
      }
      return fallback;
    }
  }

  // Cleanup old error tracking data
  cleanup() {
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    
    this.lastErrors.forEach((time, key) => {
      if (time < tenMinutesAgo) {
        this.lastErrors.delete(key);
        this.errorCounts.delete(key);
      }
    });
  }
}

// Auto cleanup every 10 minutes
setInterval(() => {
  ErrorReduction.getInstance().cleanup();
}, 10 * 60 * 1000);

export const errorReduction = ErrorReduction.getInstance();