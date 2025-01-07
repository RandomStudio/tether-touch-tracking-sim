import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	server: { port: 8080 },
	plugins: [sveltekit()],
	resolve: {
		alias: {
			Buffer: 'buffer',
			mqtt: 'mqtt/dist/mqtt.js'
		}
	}
});
