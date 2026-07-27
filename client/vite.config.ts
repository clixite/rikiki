import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'Rikiki — le jeu de cartes entre amis',
        short_name: 'Rikiki',
        description: 'Joue au Rikiki à plusieurs, chacun sur son téléphone !',
        lang: 'fr',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        background_color: '#0d3b20',
        theme_color: '#14532d',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/socket\.io/],
        runtimeCaching: [],
        // Notifications « c'est ton tour » : on greffe les écouteurs `push` et
        // `notificationclick` sur le service worker généré, sans toucher au
        // precache (voir client/public/push-sw.js).
        importScripts: ['/push-sw.js'],
        // Le script importé est chargé par `importScripts`, inutile de le précacher.
        globIgnores: ['**/node_modules/**/*', 'push-sw.js'],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/socket.io': { target: 'http://localhost:3000', ws: true },
    },
  },
});
