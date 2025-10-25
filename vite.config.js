import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
    tailwindcss(),
  ],
  server: {
    host: true, // allows connections from outside localhost
    port: 5173, // or whatever port you are using
    allowedHosts: ['21c1c269ecb5.ngrok-free.app'], // add your ngrok host here
    proxy: {
      "/api": "http://localhost:5000", // backend server
    },
  },
  build: {
    sourcemap: false, // ✅ disables source maps in production
  },
});