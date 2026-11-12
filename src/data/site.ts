import models from './models.json';

export const site = {
  name: 'Kia Bhutan',
  company: 'Shingkhar Pvt. Ltd.',
  title: 'Kia Bhutan - Kia Motor in Bhutan',
  description:
    'Welcome to Kia Bhutan, we are the sole and exclusive distributor for Kia Corporation in Bhutan. We welcome you to visit our showroom located at City Mall, Chubachu, Thimphu.',
  logo: '/wp-content/uploads/2019/09/Untitled-1.png',
  ogImage: '/wp-content/uploads/2021/06/cropped-favicon_shingkhar-1.jpg',
  showroom: 'City Mall, Chubachu, Thimphu',
  serviceCenter: 'Babesa, Thimphu',
  email: 'kiabhutansales@gmail.com',
  emailHref: 'mailto:kiabhutansales1@gmail.com',
  phones: [
    { label: 'Sales', display: '+975-2-326826 / 77 32 90 06', tel: '+9752326826' },
    { label: 'Service', display: '+975-77 77 79 19', tel: '+97577777919' },
    { label: 'Spare Parts', display: '+975-17620-380', tel: '+97517620380' },
  ],
  social: [
    { name: 'Facebook', href: 'https://www.facebook.com/kiamotorsbhutan/?ref=br_rs', icon: 'facebook' },
    { name: 'Twitter', href: '#', icon: 'twitter' },
    { name: 'Instagram', href: 'https://www.instagram.com/kiabhutan/', icon: 'instagram' },
  ],
  mapEmbed:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3539.728646337534!2d89.63654361541212!3d27.47770604215223!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39e1955a1a829f35%3A0xae697f5d80f28047!2sKia+Motors+Bhutan!5e0!3m2!1sen!2sbt!4v1560569955588!5m2!1sen!2sbt',
  homeVideo: 'boYtpG5Ifg8',
};

export const hours = [
  ['Monday', '9:00 AM-5:00 PM'],
  ['Tuesday', '9:00 AM-5:00 PM'],
  ['Wednesday', '9:00 AM-5:00 PM'],
  ['Thursday', '9:00 AM-5:00 PM'],
  ['Friday', '9:00 AM-5:00 PM'],
  ['Saturday', '9:00 AM-1:00 PM'],
  ['Sunday', 'Closed'],
] as const;

export type Model = (typeof models)[number];
export const allModels = models as Model[];
export const modelsAll = allModels.filter((m) => m.group === 'all');
export const modelsNew = allModels.filter((m) => m.group === 'new');

/** Sales offers link to their model page (the old per-offer post pages were removed). */
export const salesModelLinks: Record<string, string> = {
  'book-your-kia-seltos-today-at-nu-300000': '/kiabhutan-seltos/',
  'coming-soon': '/sonet/',
  'everyone-deserves-to-own-a-kia-soul-get-10-off-on-the-new-kia-soul-now': '/carens/',
};

export const insideKia = [
  { label: 'Sales', href: '/category/uncategorized/sales/' },
  { label: 'Service', href: '/service/' },
  { label: 'Spare Parts', href: '/spare-parts/' },
];

export const mainNav = [
  { label: 'Kia Videos', href: '/kia-videos/' },
  { label: 'about us', href: '/about-us/' },
  { label: 'contact us', href: '/contact-us/' },
  { label: 'Career', href: '/career/' },
  { label: 'Kia Buzz', href: '/category/kia-buzz/' },
];

export const footerLinks = [
  { label: 'about us', href: '/about-us/' },
  { label: 'suppliers', href: '#' },
  { label: 'sitemap', href: '/sitemap/' },
  { label: 'disclaimer', href: '/disclaimer/' },
];

export const heroSlides = [
  { src: '/wp-content/uploads/2019/06/Landing-Page-Slide-1.jpg', alt: 'The new Seltos — The Badass. Reborn.', model: 'Seltos', href: '/kiabhutan-seltos/' },
  { src: '/wp-content/uploads/2019/06/Landing-Page-Slide-2.jpg', alt: 'Sonet — Wild by design', model: 'Sonet', href: '/sonet/' },
  { src: '/wp-content/uploads/2019/06/Landing-Page-Slide-3.png', alt: 'Carens — From a different world', model: 'Carens', href: '/carens/' },
  { src: '/wp-content/uploads/2019/07/slides-5.jpg', alt: 'Sonet — Wild by Design', model: 'Sonet', href: '/sonet/' },
];

/** Normalise a slider label like "sportage exterior" to "Exterior". */
export function sectionName(label: string) {
  const last = label.trim().split(/\s+/).pop() ?? label;
  const n = last.charAt(0).toUpperCase() + last.slice(1).toLowerCase();
  return n === 'Highlight' ? 'Highlights' : n;
}

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
