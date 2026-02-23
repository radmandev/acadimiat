/**
 * Logger Utility
 * 
 * Simple, production-ready logging utility that outputs structured logs
 * with timestamps. Can be extended to use Winston, Pino, or other
 * logging libraries for advanced features (file rotation, log levels, etc.)
 */

const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log levels
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
  SUCCESS: 'SUCCESS'
};

/**
 * Format log message with timestamp and level
 */
const formatLog = (level, message, meta = '') => {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` | ${meta}` : '';
  return `[${timestamp}] [${level}] ${message}${metaStr}`;
};

/**
 * Write log to console
 */
const writeToConsole = (level, message, meta) => {
  const logMessage = formatLog(level, message, meta);
  
  switch (level) {
    case LOG_LEVELS.ERROR:
      console.error('\x1b[31m%s\x1b[0m', logMessage); // Red
      break;
    case LOG_LEVELS.WARN:
      console.warn('\x1b[33m%s\x1b[0m', logMessage); // Yellow
      break;
    case LOG_LEVELS.SUCCESS:
      console.log('\x1b[32m%s\x1b[0m', logMessage); // Green
      break;
    case LOG_LEVELS.DEBUG:
      console.debug('\x1b[36m%s\x1b[0m', logMessage); // Cyan
      break;
    case LOG_LEVELS.INFO:
    default:
      console.log('\x1b[34m%s\x1b[0m', logMessage); // Blue
      break;
  }
};

/**
 * Write log to file
 */
const writeToFile = (level, message, meta) => {
  const logMessage = formatLog(level, message, meta);
  const logFile = path.join(logsDir, `${new Date().toISOString().split('T')[0]}.log`);
  
  try {
    fs.appendFileSync(logFile, logMessage + '\n');
  } catch (err) {
    console.error('Failed to write log to file:', err.message);
  }
};

/**
 * Logger object with methods for different log levels
 */
const logger = {
  /**
   * Log error messages
   */
  error: (message, meta) => {
    writeToConsole(LOG_LEVELS.ERROR, message, meta);
    writeToFile(LOG_LEVELS.ERROR, message, meta);
  },

  /**
   * Log warning messages
   */
  warn: (message, meta) => {
    writeToConsole(LOG_LEVELS.WARN, message, meta);
    writeToFile(LOG_LEVELS.WARN, message, meta);
  },

  /**
   * Log info messages
   */
  info: (message, meta) => {
    writeToConsole(LOG_LEVELS.INFO, message, meta);
    writeToFile(LOG_LEVELS.INFO, message, meta);
  },

  /**
   * Log debug messages (only in development)
   */
  debug: (message, meta) => {
    if (process.env.NODE_ENV !== 'production') {
      writeToConsole(LOG_LEVELS.DEBUG, message, meta);
      writeToFile(LOG_LEVELS.DEBUG, message, meta);
    }
  },

  /**
   * Log success messages
   */
  success: (message, meta) => {
    writeToConsole(LOG_LEVELS.SUCCESS, message, meta);
    writeToFile(LOG_LEVELS.SUCCESS, message, meta);
  }
};

module.exports = logger;
