import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // IMPORTANT: Change this to match your GitHub repo name
  // If your repo is https://github.com/youruser/sigma-plugins
  // then base should be "/sigma-plugins/"
  base: "/sigma-plugins/",
})
