import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/", // Explicitly set the base path for production builds
  server: {
   host: "0.0.0.0", // Listen on all network interfaces
   port: 9000, // Match the port from the error message
   hmr: {
    protocol: 'wss',
    host: '9000-firebase-studyai-1772675251327.cluster-cz5nqyh5nreq6ua6gaqd7okl7o.cloudworkstations.dev',
    clientPort: 443,
   },
},
define: {
  // Cloudflare Reverse Proxy for India ISP bypass (Jio/Airtel block Supabase)
  'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://icy-fog-5f24.ajit91884270.workers.dev'),
},
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
}));
