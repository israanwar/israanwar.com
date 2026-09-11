import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: { cssMinify: true },
  // jSquash codecs (Image Compressor tool) ship Emscripten/wasm-bindgen glue
  // that resolves its own .wasm binary relative to `import.meta.url` at
  // runtime. esbuild's dev-server dependency pre-bundling copies that glue
  // into `.vite/deps`, which breaks the relative path — so these packages
  // are excluded from pre-bundling and loaded from node_modules as-is.
  // `worker.format: "es"` is required for the worker to use dynamic
  // `import()` for the codecs' wasm-bindgen loaders.
  optimizeDeps: {
    exclude: ["@jsquash/jpeg", "@jsquash/webp", "@jsquash/oxipng"],
  },
  worker: { format: "es" },
  assetsInclude: ["**/*.wasm"],
});
