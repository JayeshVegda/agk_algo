import { siteOrigin, storefrontPages } from '../src/lib/storefrontPages.js';

const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (ch) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[ch]);

function storefrontHtml(shell, path, page) {
  const url = siteOrigin + path;
  const title = escapeHtml(page.title);
  const description = escapeHtml(page.description);
  const links = page.links.map(([href, label]) =>
    `<li><a class="underline underline-offset-4" href="${escapeHtml(href)}">${escapeHtml(label)}</a></li>`).join('');
  const content = `
    <main class="mx-auto w-full max-w-5xl space-y-8 px-4 py-14 text-akg-text">
      <header class="max-w-2xl">
        <a class="text-sm font-semibold text-akg-accent" href="/">AKG ALGO</a>
        <h1 class="mt-4 font-display text-4xl font-extrabold">${escapeHtml(page.heading)}</h1>
        <p class="mt-4 text-base leading-relaxed text-akg-muted">${escapeHtml(page.intro)}</p>
      </header>
      <section class="rounded-xl border border-akg-hairline bg-akg-card p-5">
        <h2 class="font-display text-xl font-bold">${escapeHtml(page.guideHeading)}</h2>
        <p class="mt-2 max-w-3xl text-sm leading-relaxed text-akg-muted">${escapeHtml(page.guide)}</p>
        <ul class="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-akg-accent">${links}</ul>
      </section>
    </main>`;

  return shell
    .replace(/<title>[^<]*<\/title>/, () => `<title>${title}</title>\n    <link rel="canonical" href="${url}">`)
    .replace(/(<meta (?:name="description"|property="og:description"|name="twitter:description") content=")[^"]*/, (_, prefix) => prefix + description)
    .replace(/(<meta (?:property="og:title"|name="twitter:title") content=")[^"]*/, (_, prefix) => prefix + title)
    .replace(/(<meta property="og:url" content=")[^"]*/, (_, prefix) => prefix + url)
    .replace('<div id="root"></div>', () => `<div id="root">${content}</div>`)
    .replace(/\s*<noscript>\s*<p>AKG ALGO sells[\s\S]*?<\/noscript>/, '');
}

export function storefrontHtmlPlugin(hosted) {
  return {
    name: 'akg-storefront-html',
    apply: 'build',
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        const shell = bundle['index.html'].source.toString();
        if (hosted) {
          this.emitFile({ type: 'asset', fileName: 'app.html', source: shell });
        }
        for (const [path, page] of Object.entries(storefrontPages)) {
          const html = storefrontHtml(shell, path, page);
          if (hosted && path === '/') {
            bundle['index.html'].source = html;
          } else {
            this.emitFile({ type: 'asset', fileName: `storefront/${page.file}.html`, source: html });
          }
        }
      },
    },
  };
}
