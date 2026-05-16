import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Soleil/',
  build: {
    rollupOptions: {
      input: {
        // キー名（左側）は任意、値（右側）にターゲットのHTMLパスを指定
        main: './chart.html', 
      },
    },
  },
  server: {
    port: 3000,
    cors: true // CORSを許可
  }
});