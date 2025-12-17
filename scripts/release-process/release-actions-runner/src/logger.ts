import winston from 'winston';
import fs from 'fs';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

const outputFilePath = 'output/';
export function createCsvLogger(filename: string): winston.Logger {
  // Ensure the file is truncated (emptied) at the start by setting 'flags' to 'w'
  return winston.createLogger({
    levels: { csv: 0 },
    transports: [
      new winston.transports.File({
        filename: `${outputFilePath}${filename}`,
        level: 'csv',
        format: winston.format.printf(
          (log: winston.Logform.TransformableInfo) => String(log.message)
        )
      })
    ]
  });
}

// workaround for winston creating empty logger files
export function removeEmptyLoggerFiles(filenames: string[]): void {
  filenames.forEach((filename) => {
    const filePath = `${outputFilePath}${filename}`;
    try {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        if (stats.size === 0) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (err: any) {
      logger.warn(`Failed to remove logger file ${filePath}: ${err}`);
    }
  });
}

export default logger;
