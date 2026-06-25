import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    target: 'es2020',
    reportCompressedSize: false,
    // Generate source maps but don't expose them publicly — upload to Sentry instead
    sourcemap: 'hidden',
    // Inline assets smaller than 4KB directly into the bundle (avoids extra requests)
    assetsInlineLimit: 4096,
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Core React runtime — cached independently, rarely changes
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'vendor-react';
          }
          // Router — small, rarely changes
          if (id.includes('node_modules/react-router')) {
            return 'vendor-router';
          }
          // Helmet — small, rarely changes
          if (id.includes('node_modules/react-helmet-async')) {
            return 'vendor-helmet';
          }
        },
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      legalComments: 'none',
    },
  },
})
