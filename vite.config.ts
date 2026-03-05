import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/", // Explicitly set the base path for production builds
  server: {
   host: "0.0.0.0", // Listen on all network interfaces
   port: 9002, // Match the port from the error message
   hmr: {
     // This is the fix for the websocket connection error in Cloud Workstations.
     // It tells the client to use the standard public port (443 for HTTPS)
     // and secure websockets.
     clientPort: 443,
     protocol: "wss",
   },
},
define: {
  // Cloudflare Reverse Proxy for India ISP bypass (Jio/Airtel block supabase.co)
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
      react: path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
      "react/jsx-runtime": path.resolve(__dirname, "./node_modules/react/jsx-runtime"),
      "react/jsx-dev-runtime": path.resolve(__dirname, "./node_modules/react/jsx-dev-runtime"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  optimizeDeps: {
    force: true,
    include: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
    exclude: ["@lovable.dev/cloud-auth-js"],
  },
}));
