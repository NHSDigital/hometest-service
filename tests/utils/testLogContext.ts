interface TestLogContext {
  worker: string;
  testTitle: string;
  nhsNumber: string;
  browser: string;
}

let _context: TestLogContext = {
  worker: "Worker-?",
  testTitle: "unknown",
  nhsNumber: "unknown",
  browser: "unknown",
};

export function setTestLogContext(context: TestLogContext): void {
  _context = context;
}

export function getTestLogPrefix(): string {
  return `[${_context.worker}] [${_context.browser}] [${_context.nhsNumber}] "${_context.testTitle}"`;
}
