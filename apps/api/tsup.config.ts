import { defineConfig } from 'tsup'

// Bundle each entry through esbuild. `splitting: true` hoists modules shared
// across entries into chunks, so a module like `lib/better-auth.js` — which is
// reachable from both `app.ts` (via route handlers) and from `lib/better-auth.js`
// itself (exported as `@sentral/api/auth`) — is evaluated exactly once per
// Node process. Without splitting, each entry would ship its own
// `betterAuth(options)` and consumers importing from both entries would get
// two distinct auth instances.
//
// Why tsup/esbuild over tsc: tsc OOMs on the API's type graph (see L-001).
// esbuild never type-checks; `npm run type-check` still runs tsc separately.
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    app: 'src/app.ts',
    'ws-standalone': 'src/ws-standalone.ts',
    'lib/better-auth': 'src/lib/better-auth.js',
  },
  format: ['esm'],
  target: 'node22',
  platform: 'node',
  outDir: 'dist',
  bundle: true,
  splitting: true,
  clean: true,
  sourcemap: true,
  dts: false,
  shims: false,
  // Keep workspace packages external so Node resolves them from node_modules
  // at runtime (matches how the Dockerfile sets up `@sentral/shared`).
  external: ['@sentral/shared'],
})
