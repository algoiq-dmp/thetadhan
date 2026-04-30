export const API_URL = import.meta.env.VITE_API_URL || 'https://thetadhan-api.parlight2.workers.dev';
export const FEED_URL = import.meta.env.VITE_FEED_URL || 'wss://thetadhan-api.parlight2.workers.dev/api/feed';

// Use production URLs if deployed to Cloudflare Pages
if (import.meta.env.PROD) {
  // Production URLs are the same as above since the backend is already hosted
}
