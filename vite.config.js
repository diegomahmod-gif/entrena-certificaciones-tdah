import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Obligatorio para GitHub Pages de proyecto: sin esto la web sale en blanco.
  base: '/entrena-certificaciones-tdah/',
  plugins: [react()],
  test: {
    environment: 'node',
  },
})
