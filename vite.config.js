import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import basicSsl from '@vitejs/plugin-basic-ssl'

<<<<<<< HEAD
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
=======
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const useHttps = env.VITE_DEV_HTTPS === 'true'

  return {
    plugins: [react(), ...(useHttps ? [basicSsl()] : [])],
    server: {
      https: useHttps,
      host: true,
>>>>>>> 9133937 (fix(config): refactor Vite configuration to support HTTPS based on environment variable)
    },
  }
})
