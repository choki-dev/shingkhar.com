// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// BASE_PATH is set by the GitHub Pages workflow (site lives at /shingkhar.com/).
// Local and Cloudflare builds leave it unset, use / and keep the /api/form Worker route.
const BASE = (process.env.BASE_PATH || '').replace(/\/+$/, '');
const githubPages = BASE !== '';

/**
 * The site's content uses root links like "/about-us/" and "/wp-content/…".
 * For a sub-path build, prefix every root-relative URL in the built HTML and CSS with the base.
 */
function prefixRootLinks() {
  const esc = BASE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // attribute="/x"  (not "//cdn" and not already prefixed)
  const attr = new RegExp(`(\\s[\\w:-]+=)(["'])/(?!/|${esc.slice(1)}/)`, 'g');
  // url(/x)  url('/x')
  const cssUrl = new RegExp(`url\\((["']?)/(?!/|${esc.slice(1)}/)`, 'g');
  // <meta http-equiv="refresh" content="0;url=/x">
  const refresh = new RegExp(`(;\\s*url=)/(?!/|${esc.slice(1)}/)`, 'gi');

  /** @param {string} dir */
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name);
      if (entry.isDirectory()) await walk(p);
      else if (/\.(html|css)$/.test(entry.name)) {
        const src = await readFile(p, 'utf8');
        const out = src
          .replace(attr, `$1$2${BASE}/`)
          .replace(cssUrl, `url($1${BASE}/`)
          .replace(refresh, `$1${BASE}/`);
        if (out !== src) await writeFile(p, out);
      }
    }
  }

  return {
    name: 'prefix-root-links',
    hooks: {
      /** @param {{ dir: URL }} opts */
      'astro:build:done': async ({ dir }) => walk(fileURLToPath(dir)),
    },
  };
}

/** The form endpoint needs a server, so it is only added for the Cloudflare build. */
function formApi() {
  return {
    name: 'form-api',
    hooks: {
      /** @param {{ injectRoute: (r: { pattern: string; entrypoint: string }) => void }} opts */
      'astro:config:setup': ({ injectRoute }) => injectRoute({ pattern: '/api/form', entrypoint: './src/api/form.ts' }),
    },
  };
}

// https://astro.build/config
export default defineConfig({
  site: 'https://shingkhar.com',
  base: githubPages ? BASE : '/',
  trailingSlash: 'ignore',
  adapter: githubPages ? undefined : cloudflare(),
  integrations: githubPages ? [prefixRootLinks()] : [formApi()],
  // Old sales offer pages were removed; send visitors (and search engines) to the model page
  redirects: {
    '/book-your-kia-seltos-today-at-nu-300000': { status: 301, destination: '/kiabhutan-seltos/' },
    '/coming-soon': { status: 301, destination: '/sonet/' },
    '/everyone-deserves-to-own-a-kia-soul-get-10-off-on-the-new-kia-soul-now': { status: 301, destination: '/carens/' },
  },
});
