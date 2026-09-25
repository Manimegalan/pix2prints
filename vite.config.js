import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Served at https://manimegalan.github.io/pix2prints/ — a GitHub Pages
  // *project* page, so every asset URL must be prefixed with the repo name.
  base: '/pix2prints/',
})
