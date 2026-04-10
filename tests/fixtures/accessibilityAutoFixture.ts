import * as fs from "node:fs";
import * as path from "node:path";

import AxeBuilder from "@axe-core/playwright";
import { Frame, TestInfo, test as base } from "@playwright/test";
import { AxeResults, Result } from "axe-core";
import { createHtmlReport } from "axe-html-reporter";

import { ConfigFactory } from "../configuration/EnvironmentConfiguration";

export const SCANNED_URLS_FILE = path.resolve(
  __dirname,
  "..",
  "testResults",
  "a11y-scanned-urls.json",
);
export const A11Y_REPORTS_DIR = path.resolve(__dirname, "..", "testResults", "accessibility");
export const AUTO_REPORTS_DIR = path.resolve(
  __dirname,
  "..",
  "testResults",
  "accessibility",
  "auto",
);
const LOCK_FILE = `${SCANNED_URLS_FILE}.lock`;
const LOCK_TIMEOUT_MS = 5_000;
const LOCK_RETRY_BASE_MS = 10;
const LOCK_RETRY_MAX_MS = 200;

function readScannedUrls(): Set<string> {
  try {
    return new Set(JSON.parse(fs.readFileSync(SCANNED_URLS_FILE, "utf8")) as string[]);
  } catch {
    return new Set();
  }
}

function writeScannedUrls(urls: Set<string>): void {
  fs.writeFileSync(SCANNED_URLS_FILE, JSON.stringify([...urls], null, 2), "utf8");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function tryAcquireLock(): boolean {
  try {
    const fd = fs.openSync(LOCK_FILE, "wx");
    fs.closeSync(fd);
    return true;
  } catch {
    return false;
  }
}

function releaseLock(): void {
  try {
    fs.unlinkSync(LOCK_FILE);
  } catch {
    // Lock file may already have been cleaned up.
  }
}

async function withLock<T>(fn: () => T): Promise<T | undefined> {
  const deadline = Date.now() + LOCK_TIMEOUT_MS;
  let delay = LOCK_RETRY_BASE_MS;
  while (Date.now() < deadline) {
    if (tryAcquireLock()) {
      try {
        return fn();
      } finally {
        releaseLock();
      }
    }
    await sleep(delay);
    delay = Math.min(delay * 2, LOCK_RETRY_MAX_MS);
  }
  return undefined;
}

async function tryClaimUrl(url: string): Promise<boolean> {
  const result = await withLock(() => {
    const existing = readScannedUrls();
    if (existing.has(url)) return false;
    existing.add(url);
    writeScannedUrls(existing);
    return true;
  });
  return result ?? false;
}

async function unclaimUrl(url: string): Promise<void> {
  await withLock(() => {
    const existing = readScannedUrls();
    existing.delete(url);
    writeScannedUrls(existing);
  });
}

const ACCESSIBILITY_STANDARDS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] as const;

export interface AutoAccessibilityOptions {
  failOnViolation?: boolean;
}

interface AutoAccessibilityFixtures {
  autoAccessibilityOptions: AutoAccessibilityOptions;
  autoA11ySetup: void;
  scanA11y: (label: string) => Promise<void>;
}

interface AutoAccessibilityWorkerFixtures {
  workerScannedUrls: Set<string>;
}

const defaultOptions: AutoAccessibilityOptions = {
  failOnViolation: true,
};

export const accessibilityAutoFixture = base.extend<
  AutoAccessibilityFixtures,
  AutoAccessibilityWorkerFixtures
>({
  workerScannedUrls: [
    async ({}, use) => {
      await use(new Set<string>());
    },
    { scope: "worker" },
  ],

  autoAccessibilityOptions: [defaultOptions, { option: true }],

  autoA11ySetup: [
    async ({ page, autoAccessibilityOptions, workerScannedUrls }, use, testInfo: TestInfo) => {
      if (testInfo.tags.includes("@accessibility")) {
        await use();
        return;
      }

      const options = { ...defaultOptions, ...autoAccessibilityOptions };

      const standardsConfig = ConfigFactory.getConfig().accessibilityStandards;
      const standards: string[] = standardsConfig
        ? standardsConfig.split(",").map((s: string) => s.trim())
        : [...ACCESSIBILITY_STANDARDS];

      const violations: Array<{ url: string; violation: Result }> = [];
      const scannedUrls = new Set<string>();
      const pending: Promise<void>[] = [];

      const absoluteReportDir = AUTO_REPORTS_DIR;
      const relativeReportDir = path.relative(process.cwd(), absoluteReportDir);
      fs.mkdirSync(absoluteReportDir, { recursive: true });

      const onFrameNavigated = (frame: Frame): void => {
        if (frame !== page.mainFrame()) return;
        const url = frame.url();
        if (url === "about:blank" || url.startsWith("data:")) return;
        if (workerScannedUrls.has(url)) return;
        workerScannedUrls.add(url);

        const scanPromise = tryClaimUrl(url)
          .then(async (claimed) => {
            if (!claimed) return null;
            await page.locator("h1").first().waitFor({ state: "visible", timeout: 10000 });
            if (page.url() !== url) {
              workerScannedUrls.delete(url);
              await unclaimUrl(url);
              return null;
            }
            return new AxeBuilder({ page }).withTags(standards).analyze();
          })
          .then((results: AxeResults | null) => {
            if (!results) return;
            scannedUrls.add(url);
            results.violations.forEach((v) => violations.push({ url, violation: v }));

            const urlSlug =
              url
                .replace(/^https?:\/\/[^/]+/, "")
                .replace(/[^a-zA-Z0-9-]/g, "_")
                .replace(/^_+|_+$/g, "")
                .substring(0, 80) || "root";
            const reportFileName = `auto-${urlSlug}-accessibility-report.html`;
            const absoluteReportPath = path.join(absoluteReportDir, reportFileName);

            createHtmlReport({
              results,
              options: {
                projectKey: url,
                outputDir: relativeReportDir,
                reportFileName,
              },
            });

            return absoluteReportPath;
          })
          .then(async (reportPath: string | undefined) => {
            if (!reportPath || !fs.existsSync(reportPath)) return;
            await testInfo.attach(`a11y: ${url}`, {
              path: reportPath,
              contentType: "text/html",
            });
          })
          .catch(async () => {
            workerScannedUrls.delete(url);
            await unclaimUrl(url);
          });

        pending.push(scanPromise);
      };

      page.on("framenavigated", onFrameNavigated);

      await use();

      page.off("framenavigated", onFrameNavigated);
      await Promise.allSettled(pending);

      await testInfo.attach("auto-accessibility-report", {
        body: JSON.stringify(
          {
            pagesScanned: [...scannedUrls],
            violationCount: violations.length,
            violations: violations.map(({ url, violation }) => ({
              url,
              id: violation.id,
              impact: violation.impact,
              description: violation.description,
              nodeCount: violation.nodes.length,
            })),
          },
          null,
          2,
        ),
        contentType: "application/json",
      });

      if (violations.length === 0) return;

      const summary = violations
        .map(
          ({ url, violation }) =>
            `  [${violation.impact ?? "unknown"}] ${violation.id} on ${url}: ${violation.description}`,
        )
        .join("\n");

      if (options.failOnViolation) {
        throw new Error(
          `Automatic accessibility check found ${violations.length} violation(s):\n${summary}`,
        );
      }
    },
    { auto: true },
  ],

  scanA11y: async (
    { page, autoAccessibilityOptions, workerScannedUrls },
    use,
    testInfo: TestInfo,
  ) => {
    const options = { ...defaultOptions, ...autoAccessibilityOptions };

    const standardsConfig = ConfigFactory.getConfig().accessibilityStandards;
    const standards: string[] = standardsConfig
      ? standardsConfig.split(",").map((s: string) => s.trim())
      : [...ACCESSIBILITY_STANDARDS];

    const violations: Array<{ url: string; violation: Result }> = [];
    const scannedLabels = new Set<string>();
    const absoluteReportDir = AUTO_REPORTS_DIR;
    const relativeReportDir = path.relative(process.cwd(), absoluteReportDir);
    fs.mkdirSync(absoluteReportDir, { recursive: true });

    await use(async (label: string) => {
      const claimKey = `label:${label}`;
      if (workerScannedUrls.has(claimKey)) return;
      workerScannedUrls.add(claimKey);
      if (!(await tryClaimUrl(claimKey))) return;

      const url = page.url();
      let results: AxeResults;
      try {
        results = await new AxeBuilder({ page }).withTags(standards).analyze();
      } catch (_e) {
        workerScannedUrls.delete(claimKey);
        await unclaimUrl(claimKey);
        return;
      }

      scannedLabels.add(label);
      results.violations.forEach((v) => violations.push({ url, violation: v }));

      const labelSlug = label.replace(/[^a-zA-Z0-9-]/g, "_").substring(0, 80);
      const reportFileName = `auto-${labelSlug}-accessibility-report.html`;
      const absoluteReportPath = path.join(absoluteReportDir, reportFileName);

      createHtmlReport({
        results,
        options: {
          projectKey: `${url} (${label})`,
          outputDir: relativeReportDir,
          reportFileName,
        },
      });

      if (fs.existsSync(absoluteReportPath)) {
        await testInfo.attach(`a11y: ${label}`, {
          path: absoluteReportPath,
          contentType: "text/html",
        });
      }
    });

    if (scannedLabels.size === 0) return;

    const summary = violations
      .map(
        ({ url, violation }) =>
          `  [${violation.impact ?? "unknown"}] ${violation.id} on ${url}: ${violation.description}`,
      )
      .join("\n");

    await testInfo.attach("auto-accessibility-report-labels", {
      body: JSON.stringify(
        {
          labelsScanned: [...scannedLabels],
          violationCount: violations.length,
          violations: violations.map(({ url, violation }) => ({
            url,
            id: violation.id,
            impact: violation.impact,
            description: violation.description,
            nodeCount: violation.nodes.length,
          })),
        },
        null,
        2,
      ),
      contentType: "application/json",
    });

    if (violations.length === 0) return;

    if (options.failOnViolation) {
      throw new Error(
        `Automatic accessibility check found ${violations.length} violation(s):\n${summary}`,
      );
    }
  },
});
