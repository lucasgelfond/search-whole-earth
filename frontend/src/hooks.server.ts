import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Handle Chrome DevTools requests that cause 404 noise in logs
	if (event.url.pathname === '/.well-known/appspecific/com.chrome.devtools.json') {
		return new Response('{}', {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	return resolve(event);
};
