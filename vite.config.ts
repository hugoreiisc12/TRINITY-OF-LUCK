import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    middlewareMode: false,
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 8080,
    },
  },
  plugins: [
    react({
      babel: {
        plugins: [
          // Optimize for mobile
          ["@babel/plugin-proposal-decorators", { legacy: true }],
        ],
      },
    }),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "esnext",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 3,
        // Mobile optimizations
        reduce_vars: true,
        reduce_funcs: true,
      },
      mangle: true,
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          supabase: ["@supabase/supabase-js"],
          ui: ["@radix-ui/react-accordion", "@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu"],
          forms: ["@hookform/resolvers", "zod", "react-hook-form"],
          charts: ["recharts"],
          query: ["@tanstack/react-query"],
          // Mobile-specific chunk
          mobile: ["./src/hooks/useMobileOptimization.tsx"],
        },
        // Optimize chunk sizes
        chunkFileNames: "js/[name]-[hash].js",
        entryFileNames: "js/[name]-[hash].js",
        assetFileNames: ({ name }) => {
          if (/\.(gif|jpe?g|png|svg|webp)$/.test(name ?? "")) {
            return "images/[name]-[hash][extname]";
          } else if (/\.css$/.test(name ?? "")) {
            return "css/[name]-[hash][extname]";
          }
          return "[name]-[hash][extname]";
        },
      },
    },
    // Aggressive optimizations
    chunkSizeWarningLimit: 500,
    cssCodeSplit: true,
    sourcemap: mode === "development",
    reportCompressedSize: true,
    // Preload critical chunks
    ssrManifest: true,
    // Tree shaking
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
      tryCatchDeoptimization: false,
    },
  },
  optimize: {
    esbuild: {
      drop: ["console", "debugger"],
    },
  },
  css: {
    preprocessorOptions: {
      postcss: {},
    },
    modules: {
      localsConvention: "camelCase",
    },
  },
}));
