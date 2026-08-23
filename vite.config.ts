import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: {
        main: `${root}index.html`,
        app: `${root}app.html`,
        artikel: `${root}artikel.html`,
        ueberMich: `${root}ueber-mich.html`,
        impressum: `${root}impressum.html`,
        datenschutz: `${root}datenschutz.html`,
      },
    },
  },
});
