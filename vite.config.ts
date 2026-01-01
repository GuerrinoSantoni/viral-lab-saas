import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carica le variabili d'ambiente dal sistema (Vercel) o dal file .env
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Iniettiamo API_KEY in modo che sia accessibile come process.env.API_KEY nel codice
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY || '')
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true
    }
  };
});
