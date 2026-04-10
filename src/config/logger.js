// Winston logger with structured JSON format.
// All log entries include timestamp, level, and message.

const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),     // Log stack traces for errors
    format.json()                        // Structured JSON output
  ),
  transports: [
    // Console output for development
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message, stack }) => {
          return stack
            ? `[${timestamp}] ${level}: ${message}\n${stack}`
            : `[${timestamp}] ${level}: ${message}`;
        })
      ),
    }),
    // Write errors to a dedicated file
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Write all logs to combined file
    new transports.File({ filename: 'logs/combined.log' }),
  ],
});

module.exports = logger;