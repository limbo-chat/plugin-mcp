import { defineConfig } from "vite";
import limbo from "vite-plugin-limbo";

export default defineConfig({
	plugins: [limbo()],
});
