import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Obligatorio para GitHub Pages de proyecto: sin esto la web sale en blanco.
  base: '/entrena-certificaciones-tdah/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Cada examen y las dependencias van en su propio chunk para que ninguno
        // pase del límite de 500 kB. Se siguen cargando todos al arrancar
        // (imports estáticos): no cambia el comportamiento de la app.
        manualChunks(id) {
          const examen = id.match(/\/src\/content\/([\w-]+)\.json$/)
          if (examen) return `contenido-${examen[1]}`
          if (id.includes('/node_modules/')) return 'vendor'
        },
      },
    },
  },
  test: {
    environment: 'node',
  },
})
