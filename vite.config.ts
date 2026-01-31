
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, 'confidential'), '');

  return {
    plugins: [react()],
    server: {
      port: 3000,
      open: true
    },
    define: {
      'import.meta.env.User_ID': JSON.stringify(env.User_ID),
      'import.meta.env.Secure_Token': JSON.stringify(env.Secure_Token)
    }
  };
});
