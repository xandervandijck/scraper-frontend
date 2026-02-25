import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Read backend URL from environment (support both VITE_ prefix for client and plain BACKEND_URL for dev env)
const backendUrl =
  process.env.VITE_BACKEND_URL ||
  process.env.BACKEND_URL ||
  "http://localhost:3001";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: backendUrl,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
