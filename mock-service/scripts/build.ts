#!/usr/bin/env node

import { build } from "esbuild";
import { existsSync, rmSync, mkdirSync, writeFileSync, cpSync } from "fs";
import { join } from "path";

const ROOT_DIR = process.cwd();
const SRC_DIR = join(ROOT_DIR, "src");
const DIST_DIR = join(ROOT_DIR, "dist");
const MAPPINGS_SRC = join(ROOT_DIR, "..", "local-environment", "wiremock", "mappings");

async function buildMockService(): Promise<void> {
  console.log("Building mock-service lambda...");

  const entryPoint = join(SRC_DIR, "index.ts");
  const outDir = join(DIST_DIR, "mock-service-lambda");
  const outFile = join(outDir, "index.js");
  const mappingsDest = join(outDir, "mappings");

  if (!existsSync(entryPoint)) {
    throw new Error(`Entry point not found: ${entryPoint}`);
  }

  if (existsSync(outDir)) {
    rmSync(outDir, { recursive: true });
  }

  mkdirSync(outDir, { recursive: true });

  const result = await build({
    entryPoints: [entryPoint],
    bundle: true,
    outfile: outFile,
    platform: "node",
    target: "node24",
    format: "cjs",
    external: ["aws-sdk", "@aws-sdk/client-*", "@aws-sdk/lib-*"],
    packages: "bundle",
    minify: false,
    sourcemap: false,
    logLevel: "info",
    metafile: true,
  });

  writeFileSync(join(outDir, "meta.json"), JSON.stringify(result.metafile, null, 2));

  // Copy WireMock JSON mapping files into the build output
  if (existsSync(MAPPINGS_SRC)) {
    cpSync(MAPPINGS_SRC, mappingsDest, { recursive: true });
    console.log(`Copied WireMock mappings from ${MAPPINGS_SRC} → ${mappingsDest}`);
  } else {
    console.warn(`WARNING: WireMock mappings directory not found at ${MAPPINGS_SRC}`);
  }

  console.log("Build complete.");
}

buildMockService().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
