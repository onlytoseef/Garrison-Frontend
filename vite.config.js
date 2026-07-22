import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    host: '0.0.0.0', // Bind to all network interfaces
    port: 5173, // Default Vite port (optional, as 5173 is default)
  },
});
