export const siteOrigin = 'https://akgalgo.com';

export const storefrontPages = {
  '/': {
    file: 'home',
    title: 'MetaTrader 4 & 5 Trading Robots and Signals | AKG ALGO',
    description: 'Compare ready-made trading robots for MetaTrader 4 and 5, see what each one-time license includes, and browse separately priced Signal Room subscriptions.',
    heading: 'Ready-made trading robots for MetaTrader 4 and 5',
    intro: 'Choose a robot, buy a one-time license, and install it in your MetaTrader terminal.',
    guideHeading: 'Robots and signal subscriptions',
    guide: 'A robot license lets you install an Expert Advisor in MetaTrader. The Signal Room is a separate subscription that gives you access to desk posts for the published cycle.',
    links: [['/bots', 'Compare trading robots'], ['/pricing', 'View Signal Plans'], ['/risk', 'Read the risk disclosure']],
  },
  '/bots': {
    file: 'bots',
    title: 'MetaTrader 4 and 5 Trading Robots | AKG ALGO',
    description: 'Browse ready-made Expert Advisors for MetaTrader 4 and 5 and compare their platforms, requirements and one-time license prices.',
    heading: 'Find your trading robot',
    intro: 'Explore ready-made robots for MetaTrader 4 and 5. Compare platforms, markets, and one-time license prices.',
    guideHeading: 'Before you buy an Expert Advisor',
    guide: 'Check whether the robot requires MT4 or MT5, which markets it supports, and what account settings its product page recommends. After payment approval, open My Account for your license key and download.',
    links: [['/downloads/AKG_ALGO_SETUP_GUIDE.txt', 'Read the MetaTrader installation guide'], ['/refund', 'Read the refund policy'], ['/risk', 'Read the risk disclosure']],
  },
  '/pricing': {
    file: 'pricing',
    title: 'Signal Room Plans and Prices | AKG ALGO',
    description: 'Compare the SR Signal Box and Perfect Signal Box subscriptions, with scheduled cycle dates and payment details.',
    heading: 'Signal Subscriptions and Memberships',
    intro: 'Choose SR Signal Box or Perfect Signal Box for a published cycle. Renew manually when the next cycle opens.',
    guideHeading: 'How a signal cycle works',
    guide: 'Prices and dates apply to the cycle shown at checkout. After the desk approves your payment, your access follows that cycle’s start and end dates. A robot license is a separate purchase.',
    links: [['/signals', 'View the Signal Room'], ['/bots', 'Browse trading robots'], ['/refund', 'Read the refund policy']],
  },
};
