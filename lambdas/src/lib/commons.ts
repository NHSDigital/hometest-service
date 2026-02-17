export interface Commons {
  logInfo(module: string, msg: string, details?: Record<string, any>): void
  logDebug(module: string, msg: string, details?: Record<string, any>): void
  logError(module: string, msg: string, details?: Record<string, any>): void
}

export class ConsoleCommons implements Commons {
    logInfo(module: string, msg: string, details?: Record<string, any>): void {
        console.log(`[${new Date().toISOString()}][INFO][${module}] - ${msg}`, details)
    }
    logDebug(module: string, msg: string, details?: Record<string, any>): void {
      console.debug(`[${new Date().toISOString()}][INFO][${module}] - ${msg}`, details)
    }
    logError(module: string, msg: string, details?: Record<string, any>): void {
      console.error(`[${new Date().toISOString()}][INFO][${module}] - ${msg}`, details)
    }
}
