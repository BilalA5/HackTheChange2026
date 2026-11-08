import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const host = { host: '127.0.0.1', port: 5180, strictPort: true };

export default defineConfig({
  plugins: [react()],
  server: host,
  preview: host,
});
