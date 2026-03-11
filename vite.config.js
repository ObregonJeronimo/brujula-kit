import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    target: "es2018",
    cssMinify: true,
    minify: "esbuild",
    rollupOptions: {
      external: ["html2canvas"],
      output: {
        manualChunks: {
          "firebase": ["firebase/app", "firebase/auth", "firebase/firestore"],
          "pdf": ["jspdf"],
        }
      }
    }
  }
});
