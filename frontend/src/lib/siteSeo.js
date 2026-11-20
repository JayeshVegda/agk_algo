import { siteOrigin, storefrontPages } from './storefrontPages.js';

const pages = {
  ...Object.fromEntries(Object.entries(storefrontPages).map(([path, page]) => [path, [page.title, page.description]])),
  '/signals': ['Signal Room | AKG ALGO', 'View the current AKG ALGO signal cycle and learn how to join the Signal Room.'],
  '/terms': ['Terms of Service | AKG ALGO', 'Read the terms for using AKG ALGO trading robots and signal subscriptions.'],
  '/refund': ['Refund Policy | AKG ALGO', 'Read refund eligibility and how to request a refund for an AKG ALGO purchase.'],
  '/risk': ['Trading Risk Disclosure | AKG ALGO', 'Understand the risks of trading and using Expert Advisors and market signals.'],
  '/privacy': ['Privacy Policy | AKG ALGO', 'Learn how AKG ALGO handles account, contact and payment information.'],
};

export function updatePageSeo(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/';
  const page = Object.hasOwn(pages, path) ? pages[path] : null;
  const [title, description] = page || pages['/'];
  document.title = title;
  document.querySelector('meta[name="description"]').content = description;
  document.querySelector('meta[property="og:title"]').content = title;
  document.querySelector('meta[property="og:description"]').content = description;
  document.querySelector('meta[name="twitter:title"]').content = title;
  document.querySelector('meta[name="twitter:description"]').content = description;
  document.querySelector('meta[property="og:url"]').content = siteOrigin + path;

  const canonical = document.querySelector('link[rel="canonical"]') || document.createElement('link');
  if (page) {
    canonical.rel = 'canonical';
    canonical.href = siteOrigin + path;
    if (!canonical.isConnected) document.head.append(canonical);
  } else {
    canonical.remove();
  }

  const robots = document.querySelector('meta[name="robots"]') || document.createElement('meta');
  const privatePage = /^\/(?:admin|account|checkout)(?:\/|$)/.test(path);
  if (privatePage) {
    robots.name = 'robots';
    robots.content = 'noindex';
    if (!robots.isConnected) document.head.append(robots);
  } else {
    robots.remove();
  }
}
