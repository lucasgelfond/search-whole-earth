import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit(), tailwindcss()],
	optimizeDeps: {
		exclude: ['@electric-sql/pglite']
	},
	server: {
		fs: {
			// Allow serving files from node_modules
			allow: ['node_modules/@electric-sql/pglite/dist/']
		}
	},
	build: {
		target: 'esnext',
		rollupOptions: {
			// Make sure these assets are included in the build
			external: [
				'/node_modules/.vite/deps/postgres.wasm',
				'/node_modules/.vite/deps/postgres.data',
				'/node_modules/.vite/vector.tar.gz'
			]
		}
	}
});
