import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// Produces one self-contained HTML file (JS/CSS inlined, no ES module
// imports) that can be opened directly via file:// — for sharing a
// testable build with someone who doesn't have Node installed.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  base: "./",
  build: {
    outDir: "dist-standalone",
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        main: "index-react.html",
      },
    },
  },
  root: ".",
});
