import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/react-leaflet') || id.includes('node_modules/leaflet')) return 'leaflet'
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) return 'react'
        },
      },
    },
  },
})
