import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// Version affichée dans l'application : indispensable pour savoir d'un coup
// d'œil quelle version tourne réellement sur un appareil donné.
const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
  version: string;
};
// Horodatage lisible (JJ/MM HH:MM) : on peut comparer de visu la version
// affichée sur un téléphone avec la date du dernier déploiement.
// `BUILD_ID` permet de forcer un identifiant distinct (CI, tests de mise à jour).
const d = new Date();
const pad = (n: number) => String(n).padStart(2, '0');
const buildStamp =
  process.env.BUILD_ID ??
  `${version} · ${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(buildStamp),
  },
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
