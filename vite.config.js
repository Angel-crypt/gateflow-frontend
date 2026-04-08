import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const useHttps = env.VITE_DEV_HTTPS === 'true'

  return {
    plugins: [react(), ...(useHttps ? [basicSsl()] : [])],
    server: {
      https: useHttps,
      host: true,
    },
  }
})
