#!/usr/bin/env node

import {build} from 'esbuild';
import {readdirSync, statSync, mkdirSync, existsSync, rmSync, writeFileSync} from 'fs';
import {join} from 'path';

interface BuildOptions {
  buildAll: boolean;
  specificLambda?: string;
}

const LAMBDAS_DIR = join(process.cwd(), 'lambdas');
const SRC_DIR = join(LAMBDAS_DIR, 'src');
const DIST_DIR = join(LAMBDAS_DIR, 'dist');

function parseArgs(): BuildOptions {
  const args = process.argv.slice(2);
  let buildAll = true;
  let specificLambda: string | undefined;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--all':
        break;
      case '--lambda':
        buildAll = false;
        specificLambda = args[++i];
        break;
      default:
        console.error(`Unknown option: ${args[i]}`);
        console.error('Usage: build.ts [--all] [--lambda <lambda-name>]');
        process.exit(1);
    }
  }

  return {buildAll, specificLambda};
}

const isProduction = process.env.NODE_ENV === 'production';

async function buildLambda(lambdaName: string): Promise<void> {
  console.log(`Building ${lambdaName} lambda...`);

  const entryPoint = join(SRC_DIR, lambdaName, 'index.ts');
  const outDir = join(DIST_DIR, lambdaName);
  const outFile = join(outDir, `index.js`);

  if (!existsSync(entryPoint)) {
    throw new Error(`Entry point not found: ${entryPoint}`);
  }

  if (existsSync(outDir)) {
    rmSync(outDir, {recursive: true});
  }

  const result = await build({
    entryPoints: [entryPoint],
    bundle: true,
    outfile: outFile,
    platform: 'node',
    target: 'node24',
    format: 'esm',
    external: ['aws-sdk', '@aws-sdk/*'],
    packages: 'bundle',
    minify: false,
    sourcemap: false,
    logLevel: 'info',
    metafile: true
  });

  writeFileSync(join(outDir, 'meta.json'), JSON.stringify(result.metafile, null, 2));
}

function getLambdaNames(): string[] {
  if (!existsSync(SRC_DIR)) {
    return [];
  }

  return readdirSync(SRC_DIR).filter(name => name.endsWith("lambda"))
  .filter(name => {
    const fullPath = join(SRC_DIR, name);
    return statSync(fullPath).isDirectory() && existsSync(join(fullPath, 'index.ts'));
  });
}

async function main(): Promise<void> {
  const options = parseArgs();

  // Ensure output directories exist
  if (!existsSync(DIST_DIR)) {
    mkdirSync(DIST_DIR, {recursive: true});
  }

  try {
    let lambdaNames: string[] = []
    if (options.buildAll) {
      lambdaNames = getLambdaNames();
    } else if (options.specificLambda) {
      lambdaNames = [options.specificLambda];
    }

    for (const lambdaName of lambdaNames) {
      await buildLambda(lambdaName);
    }

    console.log('Build complete!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
})
