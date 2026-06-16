import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Build ra ./dist (mặc định) để deploy tĩnh lên Vercel.
})
