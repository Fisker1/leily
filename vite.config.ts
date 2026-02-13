import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
let componentTagger: any = undefined
try { componentTagger = require("lovable-tagger").componentTagger; } catch (e) { /* lovable-tagger optional */ }

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: {
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  build: {
    target: ['es2020', 'edge88', 'firefox78', 'chrome78', 'safari14'],
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
  optimizeDeps: {
    force: true,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
