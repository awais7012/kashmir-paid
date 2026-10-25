// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Pre-compress the client bundle so the server ships gzip/brotli instead of
// ~1MB of raw JS and CSS. Typed separately because the Lovable config narrows
// the nitro option type and would reject the extra key inline.
const nitroCompression = { compressPublicAssets: { gzip: true, brotli: true } } as const;

export default defineConfig({
  vite: {
    // The site's single language, inlined into both the server and the browser
    // bundle so they agree. Set it on the command line: `SITE_LANG=ur npm run dev`.
    // Defaults to English. See src/lib/site-lang.ts.
    define: {
      __SITE_LANG__: JSON.stringify(process.env["SITE_LANG"] ?? process.env["VITE_SITE_LANG"] ?? "en"),
    },
  },
  // Build a plain Node server (`.output/server/index.mjs`) for a VPS instead of
  // the Cloudflare Workers default. Inside Lovable's own build this is ignored
  // and forced back to cloudflare-module, so the editor stays unaffected.
  nitro: {
    preset: "node-server",
    ...nitroCompression,
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
