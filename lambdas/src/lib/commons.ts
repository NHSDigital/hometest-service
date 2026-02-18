export interface Commons {
  logInfo(module: string, msg: string, details?: Record<string, unknown>): void
  logDebug(module: string, msg: string, details?: Record<string, unknown>): void
  logError(module: string, msg: string, details?: Record<string, unknown>): void
}

export class ConsoleCommons implements Commons {
    logInfo(module: string, msg: string, details?: Record<string, unknown>): void {
        console.log(`[${new Date().toISOString()}][INFO][${module}] - ${msg}`, details)
    }
    logDebug(module: string, msg: string, details?: Record<string, unknown>): void {
      console.debug(`[${new Date().toISOString()}][INFO][${module}] - ${msg}`, details)
    }
    logError(module: string, msg: string, details?: Record<string, unknown>): void {
      console.error(`[${new Date().toISOString()}][INFO][${module}] - ${msg}`, details)
    }
}
