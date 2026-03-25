import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  build: {
    // Avertizare la chunks > 300KB (default 500)
    chunkSizeWarningLimit: 300,

    rollupOptions: {
      output: {
        // rolldown (Vite 8) cere funcție, nu obiect
        manualChunks(id) {
          if (id.includes('leaflet'))           return 'vendor-leaflet'
          if (id.includes('@supabase'))         return 'vendor-supabase'
          if (id.includes('react-dom') ||
              id.includes('react-router'))      return 'vendor-react'
        },
      },
    },
  },

  // Alias pentru import-uri mai curate (opțional, util în echipă)
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
