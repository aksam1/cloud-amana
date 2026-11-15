import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// While developing, the dashboard runs on port 5173 and passes API calls,
// preview pages and unsubscribe pages through to the backend on port 8000.
const backend = "http://localhost:8000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { "/api": backend, "/preview": backend, "/unsubscribe": backend },
  },
});
