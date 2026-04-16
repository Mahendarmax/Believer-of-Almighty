import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/',
  plugins: [react()],
  define: {
    __BUILD_NUMBER__: JSON.stringify(process.env.BUILD_NUMBER || 'dev'),
    __COMMIT_SHA__: JSON.stringify((process.env.COMMIT_SHA || 'local').slice(0, 7)),
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist', // matches capacitor.config.json webDir
    assetsDir: 'assets',
    target: 'es2018',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'quran-data': ['./src/data/quranData.js'],
          'islamic-data': ['./src/data/namazAndDuas.js'],
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
