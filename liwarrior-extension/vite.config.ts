import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

// ============================================================
// Vite config for LIWarrior Chrome Extension (MV3)
//
// Build strategy:
//   1. Vite builds the React pages (popup, dashboard, sidepanel)
//   2. Vite builds the service worker and content script as separate entries
//   3. A post-build plugin copies manifest.json, icons, and CSS to dist/
// ============================================================

// Plugin to copy static files to dist after build
function copyStaticFiles() {
  return {
    name: 'copy-extension-files',
    closeBundle() {
      const dist = resolve(__dirname, 'dist');

      // Copy manifest.json
      copyFileSync(
        resolve(__dirname, 'manifest.dist.json'),
        resolve(dist, 'manifest.json')
      );

      // Copy icons
      const iconsDir = resolve(dist, 'icons');
      if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true });
      for (const size of ['16', '48', '128']) {
        const src = resolve(__dirname, `public/icons/icon${size}.png`);
        if (existsSync(src)) {
          copyFileSync(src, resolve(iconsDir, `icon${size}.png`));
        }
      }

      // Copy content styles
      const contentCss = resolve(__dirname, 'src/content/content-styles.css');
      if (existsSync(contentCss)) {
        copyFileSync(contentCss, resolve(dist, 'content-styles.css'));
      }

      console.log('[LIWarrior] Extension files copied to dist/');
    },
  };
}

export default defineConfig({
  plugins: [react(), copyStaticFiles()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: false, // Easier to debug during development
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/popup.html'),
        dashboard: resolve(__dirname, 'src/dashboard/dashboard.html'),
        sidepanel: resolve(__dirname, 'src/sidepanel/sidepanel.html'),
        'service-worker': resolve(__dirname, 'src/background/service-worker.ts'),
        'content-main': resolve(__dirname, 'src/content/content-main.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Keep service worker and content script at root level
          if (chunkInfo.name === 'service-worker' || chunkInfo.name === 'content-main') {
            return '[name].js';
          }
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
