import React from 'react';
import { storefrontPages } from '../lib/storefrontPages';

export function StorefrontGuide({ path }) {
  const { guideHeading, guide, links } = storefrontPages[path];

  return (
    <section className="mx-auto w-full max-w-5xl rounded-xl border border-akg-hairline bg-akg-card p-5 sm:p-6">
      <h2 className="font-display text-xl font-bold text-akg-text">{guideHeading}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-akg-muted">{guide}</p>
      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-akg-accent">
        {links.map(([href, label]) => <li key={href}><a className="underline underline-offset-4" href={href}>{label}</a></li>)}
      </ul>
    </section>
  );
}
