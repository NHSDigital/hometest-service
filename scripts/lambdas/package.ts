#!/usr/bin/env node

import {createWriteStream, existsSync, readdirSync, rmSync, statSync} from 'fs';
import {join} from 'path';
import archiver from 'archiver';

interface PackageOptions {
  specificLambda?: string;
}

const LAMBDAS_DIR = join(process.cwd(), 'lambdas');
const DIST_DIR = join(LAMBDAS_DIR, 'dist');
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

function parseArgs(): PackageOptions {
  const args = process.argv.slice(2);

  let specificLambda: string | undefined;
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--lambda':
        specificLambda = args[++i];
        if (!specificLambda) {
          console.error('Error: --lambda requires a lambda name');
          process.exit(1);
        }
        break;
      default:
        console.error(`Unknown option: ${args[i]}`);
        console.error('Usage: package.ts [--lambda <lambda-name>]');
        process.exit(1);
    }

  }
  return {specificLambda};

}

const LAMBDA_INDEX = 'index.js';
const LAMBDA_INDEX_MAP = 'index.js.map';
const LAMBDA_PACKAGE_JSON = 'package.json';

async function createLambdaZip(lambda: string): Promise<void> {
  console.log(`Creating deployment zip for ${lambda}...`);

  const lambdaPath = join(DIST_DIR, lambda);
  const indexPath = join(lambdaPath, LAMBDA_INDEX);
  const sourcemapPath = join(lambdaPath, LAMBDA_INDEX_MAP);
  const packageJsonPath = join(LAMBDAS_DIR, LAMBDA_PACKAGE_JSON);
  const zipPath = join(DIST_DIR, `${lambda}.zip`);

  if (!existsSync(lambdaPath)) {
    console.warn(`Warning: No dist directory found for ${lambda}`);
    return;
  }

  if (existsSync(zipPath)) {
    rmSync(zipPath);
  }

  return new Promise((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = archiver('zip', {zlib: {level: 9}});

    output.on('close', () => {
      console.log(`Created ${zipPath} (${archive.pointer()} bytes)`);
      resolve();
    });

    archive.on('error', reject);
    archive.pipe(output);

    archive.file(indexPath, {name: LAMBDA_INDEX});

    if (!IS_PRODUCTION && existsSync(sourcemapPath)) {
      archive.file(sourcemapPath, {name: LAMBDA_INDEX_MAP});
      console.log(`Including sourcemap for debugging`);
    }

    archive.finalize();
  });
}

function getLambdas(): string[] {
  return readdirSync(DIST_DIR)
  .filter(name => name.endsWith('lambda'))
  .filter(name => statSync(join(DIST_DIR, name)).isDirectory());
}

async function main(): Promise<void> {
  const options = parseArgs();

  if (!existsSync(DIST_DIR)) {
    console.error(`Error: No dist directory found at ${DIST_DIR}`);
    process.exit(1);
  }

  try {
    const lambdas: string[] = options.specificLambda ? [options.specificLambda] : getLambdas();

    if (lambdas.length === 0) {
      console.log('No lambda directories found');
      return;
    }

    for (const lambdaDir of lambdas) {
      await createLambdaZip(lambdaDir);
    }


    console.log(`Deployment packages ready in ${DIST_DIR}`);
  } catch (error) {
    console.error('Packaging failed:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
})
