// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://shingkhar.com',
  trailingSlash: 'ignore',
  adapter: cloudflare(),
  // Old sales offer pages were removed; send visitors (and search engines) to the model page
  redirects: {
    '/book-your-kia-seltos-today-at-nu-300000': { status: 301, destination: '/kiabhutan-seltos/' },
    '/coming-soon': { status: 301, destination: '/sonet/' },
    '/everyone-deserves-to-own-a-kia-soul-get-10-off-on-the-new-kia-soul-now': { status: 301, destination: '/carens/' },
  },
});
