#!/usr/bin/env node

import {build} from 'esbuild';
import {readdirSync, statSync, mkdirSync, existsSync, rmSync, writeFileSync} from 'fs';
import {join} from 'path';

interface BuildOptions {
  specificLambda?: string;
}

const LAMBDAS_DIR = process.cwd();
const SRC_DIR = join(LAMBDAS_DIR, 'src');
const DIST_DIR = join(LAMBDAS_DIR, 'dist');

function parseArgs(): BuildOptions {
  const args = process.argv.slice(2);
  let specificLambda: string | undefined;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--lambda':
        specificLambda = args[++i];
        break;
      default:
        console.error(`Unknown option: ${args[i]}`);
        console.error('Usage: build.ts [--lambda <lambda-name>]');
        process.exit(1);
    }
  }

  return {specificLambda};
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
    format: 'cjs',
<<<<<<< Updated upstream
    external: ['aws-sdk', '@aws-sdk/*'],
=======
    // The Lambda nodejs24.x runtime provides @aws-sdk/client-* and @aws-sdk/lib-*
    // packages. @aws-sdk/rds-signer is NOT in the runtime and must be bundled,
    // along with its transitive deps (@smithy/*, @aws-sdk/credential-providers).
    external: [
      'aws-sdk',
      '@aws-sdk/client-*',
      '@aws-sdk/lib-*',
    ],
>>>>>>> Stashed changes
    packages: 'bundle',
    treeShaking: true,
    minify: isProduction,
    legalComments: 'none',
    sourcemap: !isProduction,
    logLevel: 'info',
    metafile: true,
  });

  writeFileSync(join(outDir, 'meta.json'), JSON.stringify(result.metafile, null, 2));
}

function getLambdas(): string[] {
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
    const lambdas: string[] = options.specificLambda ? [options.specificLambda] : getLambdas();

    await Promise.all(lambdas.map(buildLambda));

    console.log('Build complete!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

await main()
