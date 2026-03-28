import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/Believer-of-Almighty/',
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    target: 'es2018',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
        },
        // Deterministic chunk filenames for better caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    cssMinify: true,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 300,
    modulePreload: {
      polyfill: false,
    },
    // Inline small assets < 4KB as base64 to reduce requests
    assetsInlineLimit: 4096,
  },
})
