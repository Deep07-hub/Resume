/**
 * Simple logger utility for the application
 */
export class Logger {
  private static readonly LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
  };

  private static LOG_LEVEL = Logger.LOG_LEVELS.INFO;

  /**
   * Set the current log level
   */
  static setLogLevel(level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'): void {
    Logger.LOG_LEVEL = Logger.LOG_LEVELS[level];
  }

  /**
   * Log debug message
   */
  static debug(message: string, ...args: any[]): void {
    if (Logger.LOG_LEVEL <= Logger.LOG_LEVELS.DEBUG) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Log info message
   */
  static info(message: string, ...args: any[]): void {
    if (Logger.LOG_LEVEL <= Logger.LOG_LEVELS.INFO) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  /**
   * Log warning message
   */
  static warn(message: string, ...args: any[]): void {
    if (Logger.LOG_LEVEL <= Logger.LOG_LEVELS.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  /**
   * Log error message
   */
  static error(message: string, ...args: any[]): void {
    if (Logger.LOG_LEVEL <= Logger.LOG_LEVELS.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }
}

export const logger = Logger; 