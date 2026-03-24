import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      include: ['**/*.jsx', '**/*.tsx'],
    }),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'SoundWave',
        short_name: 'SoundWave',
        description: 'Global Music Application with Dolby 3D Audio',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/soundwave-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/soundwave-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/soundwave-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})

