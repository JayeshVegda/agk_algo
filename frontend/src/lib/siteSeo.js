const origin = 'https://akgalgo.com';

const pages = {
  '/': ['AKG ALGO | Trading Robots for MetaTrader 4 and 5', 'Buy ready-made MetaTrader 4 and 5 trading robots with one-time licenses. Signal subscriptions are available separately.'],
  '/bots': ['MetaTrader 4 and 5 Trading Robots | AKG ALGO', 'Browse ready-made Expert Advisors for MetaTrader 4 and 5 and compare their platforms, requirements and one-time license prices.'],
  '/pricing': ['Signal Room Plans and Prices | AKG ALGO', 'Compare the SR Signal Box and Perfect Signal Box subscriptions, with scheduled cycle dates and payment details.'],
  '/signals': ['Signal Room | AKG ALGO', 'View the current AKG ALGO signal cycle and learn how to join the Signal Room.'],
  '/terms': ['Terms of Service | AKG ALGO', 'Read the terms for using AKG ALGO trading robots and signal subscriptions.'],
  '/refund': ['Refund Policy | AKG ALGO', 'Read refund eligibility and how to request a refund for an AKG ALGO purchase.'],
  '/risk': ['Trading Risk Disclosure | AKG ALGO', 'Understand the risks of trading and using Expert Advisors and market signals.'],
  '/privacy': ['Privacy Policy | AKG ALGO', 'Learn how AKG ALGO handles account, contact and payment information.'],
};

export function updatePageSeo(path) {
  const page = Object.hasOwn(pages, path) ? pages[path] : null;
  const [title, description] = page || pages['/'];
  document.title = title;
  document.querySelector('meta[name="description"]').content = description;
  document.querySelector('meta[property="og:title"]').content = title;
  document.querySelector('meta[property="og:description"]').content = description;
  document.querySelector('meta[name="twitter:title"]').content = title;
  document.querySelector('meta[name="twitter:description"]').content = description;
  document.querySelector('meta[property="og:url"]').content = origin + path;

  const canonical = document.querySelector('link[rel="canonical"]') || document.createElement('link');
  if (page) {
    canonical.rel = 'canonical';
    canonical.href = origin + path;
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
