import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Add this 'server' block to proxy API requests
  server: {
    proxy: {
      // Proxies any request starting with /api
      '/api': {
        target: 'http://localhost/api', // Your XAMPP/PHP server
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''), // Removes /api from the start
      },
    },
  },
})