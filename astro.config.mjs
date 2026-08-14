import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  integrations: [
    tailwind({
      applyBaseStyles: true,
      config: {
        theme: {
          extend: {
            colors: {
              burgundy: {
                50: '#fdf2f4',
                100: '#fae3e7',
                200: '#f5c7cf',
                300: '#ee9fb0',
                400: '#e56b85',
                500: '#dc3d60',
                600: '#c41e3a', // Primary burgundy
                700: '#9f152e',
                800: '#82142a',
                900: '#6d1528',
                950: '#3f0815',
              },
              cream: {
                50: '#fffffc',
                100: '#fffff8',
                200: '#fefde8',
                300: '#fdfbd2',
                400: '#fcf8bc',
                500: '#fbf5a6',
                600: '#faf390',
                700: '#f9f17a',
                800: '#f8ef64',
                900: '#f7ed4e',
                950: '#f6eb38',
              },
              gold: {
                50: '#fefce8',
                100: '#fef9c3',
                200: '#fef08a',
                300: '#fde047',
                400: '#facc15',
                500: '#eab308', // Primary gold
                600: '#ca8a04',
                700: '#a16207',
                800: '#854d0e',
                900: '#713f12',
                950: '#422006',
              },
            },
            fontFamily: {
              serif: ['Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
              sans: ['Arial', 'Helvetica', 'sans-serif'],
              display: ['Playfair Display', 'Georgia', 'serif'],
            },
          },
        },
      },
    }),
    react(),
  ],
  output: 'hybrid',
  adapter: netlify({
    imageCDN: true,
    edgeMiddleware: false,
  }),
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
          },
        },
      },
    },
  },
});
