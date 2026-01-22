export class Logger {
  /**
   * Log data with timestamp prefix in square brackets
   * @param data - Data to log
   */
  static log(...data: any[]): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}]`, ...data);
  }

  /**
   * Wrap method execution in logs with title and timing
   * @param title - Title of the operation
   * @param method - Method to execute
   */
  static async wrapInLogs<T>(title: string, method: () => T | Promise<T>): Promise<T> {
    const date = new Date().toISOString();

    console.log(`${'='.repeat(10)} ${title} ${'='.repeat(10)}`);
    console.log(`${'='.repeat(10)} ${date} ${'='.repeat(10)}`);

    const result = await Promise.resolve(method());

    console.log('='.repeat(20));

    return result;
  }
}

