import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
  base: "/GForce/",
  resolve: {
    alias:
      process.env.GFORCE_TEST_BUILD === "1"
        ? {
            "./access-verifier.json": fileURLToPath(
              new URL("./tests/fixtures/access-verifier.json", import.meta.url),
            ),
          }
        : {},
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      includeAssets: ["icon-192.png", "icon-512.png"],
      manifest: {
        name: "GForce · força no seu ritmo",
        short_name: "GForce",
        lang: "pt-BR",
        start_url: "/GForce/",
        scope: "/GForce/",
        display: "standalone",
        background_color: "#101014",
        theme_color: "#101014",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        importScripts: ["local-notifications.js"],
        globPatterns: ["**/*.{js,css,html,png,svg,woff2}"],
        navigateFallback: "index.html",
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
