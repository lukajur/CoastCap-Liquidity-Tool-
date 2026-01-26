import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  // Ensure environment variables are properly exposed
  define: {
    // Make import.meta.env.PROD available (Vite does this by default)
  },
  build: {
    // Ensure sourcemaps for debugging in production if needed
    sourcemap: false,
  },
})
