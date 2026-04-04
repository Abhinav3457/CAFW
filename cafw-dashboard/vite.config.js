import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
    plugins: [react()],
    build: {
        // OneDrive-managed workspaces can block Vite from deleting the existing
        // output folder, so keep prior assets and overwrite changed files.
        emptyOutDir: false,
    },
});
