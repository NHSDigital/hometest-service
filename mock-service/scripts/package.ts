#!/usr/bin/env node

import { createWriteStream, existsSync, rmSync } from "fs";
import { join } from "path";
import archiver from "archiver";

const ROOT_DIR = process.cwd();
const DIST_DIR = join(ROOT_DIR, "dist");

async function createMockServiceZip(): Promise<void> {
  console.log("Creating deployment zip for mock-service...");

  const lambdaPath = join(DIST_DIR, "mock-service-lambda");
  const indexPath = join(lambdaPath, "index.js");
  const zipPath = join(DIST_DIR, "mock-service-lambda.zip");

  if (!existsSync(lambdaPath)) {
    throw new Error(`No dist directory found — run 'npm run build' first`);
  }

  if (existsSync(zipPath)) {
    rmSync(zipPath);
  }

  return new Promise((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      console.log(`Created ${zipPath} (${archive.pointer()} bytes)`);
      resolve();
    });

    archive.on("error", reject);
    archive.pipe(output);

    archive.file(indexPath, { name: "index.js" });
    archive.finalize();
  });
}

createMockServiceZip().catch((err) => {
  console.error("Package failed:", err);
  process.exit(1);
});
