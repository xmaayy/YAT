import sveltePreprocess from 'svelte-preprocess';

/** @type {import("@sveltejs/kit").Config} */
const config = {
	kit: {
		target: '#svelte',
		ssr: false,
	},
	preprocess: sveltePreprocess(),
};
export default config;