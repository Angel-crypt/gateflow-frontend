import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    proxy: {
      '/auth': {
        target: 'http://192.168.59.243:8000',
        changeOrigin: true,
        rewrite: (path) => `/api${path}`,
      },
      '/api': {
        target: 'http://192.168.59.243:8000',
        changeOrigin: true,
      },
    },
  },
})
