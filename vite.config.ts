import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // The site lives at https://nex0517.github.io/Taskopolis/, so every URL needs this prefix.
  base: '/Taskopolis/',
  plugins: [
    react(),
    VitePWA({
      // "prompt": a new version waits until the user taps Reload (see UpdateBanner).
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Taskopolis',
        short_name: 'Taskopolis',
        description: 'Complete real tasks. Build a city.',
        theme_color: '#7b61ff',
        background_color: '#f5f6f8',
        display: 'standalone',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
