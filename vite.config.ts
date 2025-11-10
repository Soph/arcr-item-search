import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false, // Use public/manifest.json instead
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/raw\.githubusercontent\.com\/RaidTheory\/arcraiders-data\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'arcraiders-data-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ]
      }
    })
  ],
  base: '/arcr-item-search/',
  build: {
    outDir: 'dist',
    // Generate sourcemaps for debugging production issues
    sourcemap: true,
    // Optimize chunk splitting for better caching
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: {
          'fuse': ['fuse.js'],
        },
      },
    },
  },
  // Cache headers for dev/preview server (not applicable to GitHub Pages)
  preview: {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  },
  server: {
    headers: {
      'Cache-Control': 'no-cache',
    },
  },
})
