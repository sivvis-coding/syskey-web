import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Output into the Python package so FastAPI can serve it
    outDir: "../backend/syskey/static",
    emptyOutDir: true,
  },
  server: {
    // Proxy API calls to the FastAPI backend during development
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
    allowedHosts: ["physoclistous-ellis-wrinklier.ngrok-free.dev"],
  },
});
