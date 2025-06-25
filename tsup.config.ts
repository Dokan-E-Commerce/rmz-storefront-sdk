import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/main.ts',
    'secure-storefront-sdk': 'src/secure-storefront-sdk.ts'
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: true,
  external: ['crypto', 'node-fetch', 'axios'],
})