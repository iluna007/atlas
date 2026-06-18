import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5173,
    open: true,
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
  // Permite que Vite resuelva correctamente los workers de Deck.gl
  optimizeDeps: {
    include: ['mapbox-gl'],
  },
})
