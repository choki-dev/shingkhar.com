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
- `src/pages/api/form.ts` – Contact / Spare Parts / Career form handler (only server route)

## Forms (email delivery)
Forms are sent with the Resend API. In Cloudflare → Worker → Settings → Variables and Secrets set:
- `RESEND_API_KEY` (secret)
- `FORM_TO` – e.g. `kiabhutansales@gmail.com` (comma-separate for several)
- `FORM_FROM` – a sender on a domain verified in Resend, e.g. `Kia Bhutan Website <web@shingkhar.com>`

Until these are set, forms show "please call or email us".
