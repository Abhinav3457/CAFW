import { defineConfig } from "vite";

export default defineConfig({
    build: {
        // OneDrive-managed workspaces can block Vite from deleting the existing
        // output folder, so keep prior assets and overwrite changed files.
        emptyOutDir: false,
    },
});
