interface TestLogContext {
  worker: string;
  testTitle: string;
  nhsNumber: string;
  browser: string;
}

let currentLogContext: TestLogContext = {
  worker: "Worker-?",
  testTitle: "unknown",
  nhsNumber: "unknown",
  browser: "unknown",
};

export function setTestLogContext(context: TestLogContext): void {
  currentLogContext = context;
}

export function getTestLogPrefix(): string {
  return `[${currentLogContext.worker}] [${currentLogContext.browser}] [${currentLogContext.nhsNumber}] "${currentLogContext.testTitle}"`;
}
