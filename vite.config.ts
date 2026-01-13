import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { fileURLToPath } from "url";
import dts from "vite-plugin-dts";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// Determine if building library or running example
const isBuildLib = process.env.BUILD_LIB === "true";

export default defineConfig(() => {
  if (isBuildLib) {
    // Library build mode
    return {
      plugins: [
        react(),
        dts({
          include: ["src/**/*"],
          exclude: ["src/**/*.test.ts", "src/**/*.test.tsx", "example/**/*"],
          outDir: "dist",
        }),
      ],
      build: {
        lib: {
          entry: resolve(__dirname, "src/index.ts"),
          name: "AIChatWidget",
          formats: ["es", "cjs"],
          fileName: (format) => {
            if (format === "es") {
              return "index.esm.js";
            }
            return "index.js";
          },
        },
        rollupOptions: {
          external: ["react", "react-dom"],
          output: {
            globals: {
              react: "React",
              "react-dom": "ReactDOM",
            },
          },
        },
        sourcemap: true,
        outDir: "dist",
      },
    };
  } else {
    // Example development mode
    return {
      root: "./example",
      plugins: [react()],
      resolve: {
        alias: {
          "ai-chat-widget": resolve(__dirname, "./src"),
        },
      },
      server: {
        port: 3000,
        open: true,
      },
    };
  }
});
