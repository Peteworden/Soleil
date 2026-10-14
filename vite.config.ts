import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : '/Soleil/',
  build: {
    rollupOptions: {
      input: {
        main: './chart.html',
      },
    },
  },
  server: {
    port: 3000,
    cors: true, // COERSを有効にする
  },
}));
