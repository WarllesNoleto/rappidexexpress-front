// import path from 'path';
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})

const manifest = {
  name: 'Rappidex Express',
  short_name: 'Rappidex Express',
  theme_color: '#202024',
  background_color: "#202024",
  icons: [
      {
          src: 'pwa-64x64.png',
          sizes: '64x64',
          type: 'image/png'
      },
      {
          src: 'pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png'
      },
      {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any'
      },
      {
          src: 'maskable-icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
      }
  ],
}
