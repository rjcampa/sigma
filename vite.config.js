
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  // basicSsl() serves the dev server over HTTPS with a self-signed cert.
  // Sigma runs on HTTPS and browsers block an HTTP (insecure) plugin iframe
  // inside it ("mixed content"), so the dev URL must be https://localhost:5173/sigma/
  plugins: [react(), basicSsl()],
  base: "/sigma/",
  server: {
    host: "localhost",
    port: 5173,
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
})
