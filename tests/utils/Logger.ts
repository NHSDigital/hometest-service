export class Logger {
  static log(...data: unknown[]): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}]`, ...data);
  }
  static async wrapInLogs<T>(title: string, method: () => T | Promise<T>): Promise<T> {
    const date = new Date().toISOString();

    console.log(`${"=".repeat(10)} ${title} ${"=".repeat(10)}`);
    console.log(`${"=".repeat(10)} ${date} ${"=".repeat(10)}`);

    const result = await Promise.resolve(method());

    console.log("=".repeat(20));

    return result;
  }
}
