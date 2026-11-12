# Kia Bhutan — shingkhar.com (Astro + Cloudflare)

Rebuild of https://shingkhar.com/ with the original menu, text, logo, colours
(#bc162c / #b6030b red, #00040d ink), fonts (Lato + Noto Sans), images and URLs,
in a Kia-India-style + Carzone-style layout.

## Commands
| Command | Action |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Local dev server |
| `npm run build` | Build to `./dist` (static pages + Worker for `/api/form`) |
| `npm run preview` | Preview the production build in workerd |
| `npx wrangler deploy` | Deploy to Cloudflare Workers |

## Structure
- `src/data/*.json` – content extracted from the live WordPress site (models, specs, posts, pages, videos)
- `src/data/site.ts` – menu, phones, email, showroom hours, hero slides
- `public/wp-content/uploads/…` – all images, same paths as the old site (old image links keep working)
- `src/pages/[slug].astro` – model pages, spec pages and posts on their original URLs
- `src/api/form.ts` – Contact / Spare Parts / Career form handler (only server route, added for the Cloudflare build)

## Forms (email delivery)
Forms are sent with the Resend API. In Cloudflare → Worker → Settings → Variables and Secrets set:
- `RESEND_API_KEY` (secret)
- `FORM_TO` – e.g. `kiabhutansales@gmail.com` (comma-separate for several)
- `FORM_FROM` – a sender on a domain verified in Resend, e.g. `Kia Bhutan Website <web@shingkhar.com>`

Until these are set, forms show "please call or email us".

## GitHub Pages
Every push to `main` runs `.github/workflows/deploy.yml`, which builds the site with
`BASE_PATH=/shingkhar.com` and publishes it to the `gh-pages` branch, served at
https://choki-dev.github.io/shingkhar.com/.
That build is fully static: root links are prefixed with `/shingkhar.com`, and the
`/api/form` route is left out, so the forms only send email on the Cloudflare deployment.
