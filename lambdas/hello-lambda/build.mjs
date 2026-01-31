import * as esbuild from 'esbuild'

const env = (process.env.NODE_ENV || 'development').toLowerCase()

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/index.js',
  platform: 'node',
  target: 'node24',
  format: 'esm',
  external: ['aws-sdk'],
  minify: env === 'production',
  alias: {
    '@hometest-service/shared': '../shared/dist/index.js'
  }
})
