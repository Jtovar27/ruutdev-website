import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import vm from 'node:vm';
import './check.mjs';

const output = join(process.cwd(), 'public');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

const publicFiles = new Map([
  ['index.html', 'index.html'],
  ['404.html', '404.html'],
  ['favicon.svg', 'favicon.svg'],
  ['robots.txt', 'robots.txt'],
  ['sitemap.xml', 'sitemap.xml'],
  ['pages/solutions.html', 'solutions.html'],
  ['pages/solutions/websites.html', 'solutions/websites.html'],
  ['pages/solutions/business-systems.html', 'solutions/business-systems.html'],
  ['pages/solutions/automation-ai.html', 'solutions/automation-ai.html'],
  ['pages/portfolio.html', 'work.html'],
  ['pages/process.html', 'process.html'],
  ['pages/about.html', 'about.html'],
  ['pages/pricing.html', 'pricing.html'],
  ['pages/contact.html', 'contact.html'],
  ['pages/privacy.html', 'privacy.html'],
  ['pages/terms.html', 'terms.html'],
  ['pages/pay.html', 'pay.html'],
  ['pages/payment-success.html', 'payment-success.html'],
  ['pages/project-intake.html', 'project-intake.html'],
  ['pages/admin/intakes.html', 'admin/intakes.html']
]);

for (const [source, target] of publicFiles) {
  const destination = join(output, target);
  await mkdir(dirname(destination), { recursive: true });
  await cp(source, destination);
}

const configCode = await readFile('assets/js/site-config.js', 'utf8');
const configContext = { window: {} };
vm.runInNewContext(configCode, configContext);
const site = configContext.window.RUUTDEV;
const staticHeader = `<a class="skip" href="#main" data-en="Skip to content" data-es="Saltar al contenido">Skip to content</a><header class="site-header"><nav class="nav container" aria-label="Primary navigation"><a class="logo" href="/" aria-label="RuutDev home">Ruut<span>Dev</span></a><button class="menu" type="button" data-menu aria-expanded="false" aria-controls="site-nav"><span data-en="Menu" data-es="Menú">Menu</span></button><div class="nav-links" id="site-nav">${site.navigation.map((item) => `<a href="${item.href}" data-en="${item.en}" data-es="${item.es}">${item.en}</a>`).join('')}</div><button class="lang" type="button" data-lang aria-label="ES — Switch to Spanish" aria-pressed="false">ES</button><a class="btn btn-primary" href="/contact" data-track="primary_cta_click" data-en="Start a Project" data-es="Iniciar un proyecto">Start a Project</a></nav></header>`;
const staticFooter = `<footer class="footer"><div class="container footer-grid"><div class="footer-summary"><a class="logo" href="/">Ruut<span>Dev</span></a><p data-en="Bilingual websites, business systems, and practical automation for service businesses." data-es="Websites bilingües, sistemas empresariales y automatización práctica para negocios de servicios.">Bilingual websites, business systems, and practical automation for service businesses.</p></div><div><h2 data-en="Explore" data-es="Explorar">Explore</h2><a href="/solutions" data-en="Solutions" data-es="Soluciones">Solutions</a><a href="/work" data-en="Work" data-es="Proyectos">Work</a><a href="/process" data-en="Process" data-es="Proceso">Process</a><a href="/pricing" data-en="Pricing" data-es="Precios">Pricing</a></div><div><h2 data-en="Contact" data-es="Contacto">Contact</h2><a href="mailto:${site.business.email}" data-track="email_click">${site.business.email}</a><a href="tel:${site.business.phone}" data-track="phone_click">${site.business.phoneDisplay}</a><a href="/contact" data-en="Start a Project" data-es="Iniciar un proyecto">Start a Project</a></div><div><h2 data-en="Legal" data-es="Legal">Legal</h2><a href="/privacy" data-en="Privacy" data-es="Privacidad">Privacy</a><a href="/terms" data-en="Terms" data-es="Términos">Terms</a><p class="legal">© ${new Date().getFullYear()} RuutDev · Florida, USA</p></div></div></footer>`;
const seoByTarget = {
  'index.html': 'home', '404.html': 'notFound', 'solutions.html': 'solutions',
  'solutions/websites.html': 'websites', 'solutions/business-systems.html': 'businessSystems',
  'solutions/automation-ai.html': 'automationAi', 'work.html': 'work', 'process.html': 'process',
  'about.html': 'about', 'pricing.html': 'pricing', 'contact.html': 'contact',
  'privacy.html': 'privacy', 'terms.html': 'terms', 'pay.html': 'pay',
  'payment-success.html': 'paymentSuccess', 'project-intake.html': 'projectIntake'
};
const escapeAttribute = (value) => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

for (const target of [...publicFiles.values()].filter((file) => file.endsWith('.html') && file !== 'admin/intakes.html')) {
  const file = join(output, target);
  let html = await readFile(file, 'utf8');
  const seo = site.seo[seoByTarget[target]];
  if (seo) {
    html = html
      .replace(/<title>[\s\S]*?<\/title>/i, `<title>${seo.enTitle}</title>`)
      .replace(/<meta name="description" content="[^"]*"\s*\/?\s*>/i, `<meta name="description" content="${escapeAttribute(seo.enDescription)}">`);
    if (!/data-title-en=/i.test(html)) html = html.replace(/<body([^>]*)>/i, `<body$1 data-title-en="${escapeAttribute(seo.enTitle)}" data-title-es="${escapeAttribute(seo.esTitle)}" data-description-en="${escapeAttribute(seo.enDescription)}" data-description-es="${escapeAttribute(seo.esDescription)}">`);
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1];
    let metadata = '';
    if (!/property="og:title"/i.test(html)) metadata += `<meta property="og:title" content="${escapeAttribute(seo.enTitle)}">`;
    if (!/property="og:description"/i.test(html)) metadata += `<meta property="og:description" content="${escapeAttribute(seo.enDescription)}">`;
    if (canonical && !/property="og:url"/i.test(html)) metadata += `<meta property="og:url" content="${canonical}">`;
    if (!/property="og:type"/i.test(html)) metadata += '<meta property="og:type" content="website">';
    if (!/name="twitter:card"/i.test(html)) metadata += '<meta name="twitter:card" content="summary_large_image">';
    if (!/name="twitter:title"/i.test(html)) metadata += `<meta name="twitter:title" content="${escapeAttribute(seo.enTitle)}">`;
    if (!/name="twitter:description"/i.test(html)) metadata += `<meta name="twitter:description" content="${escapeAttribute(seo.enDescription)}">`;
    const localized = !['404.html','privacy.html','terms.html','pay.html','payment-success.html','project-intake.html'].includes(target);
    if (canonical && localized && !/hreflang=/i.test(html)) metadata += `<link rel="alternate" hreflang="en" href="${canonical}"><link rel="alternate" hreflang="es" href="${canonical}?lang=es"><link rel="alternate" hreflang="x-default" href="${canonical}">`;
    if (canonical && target !== 'index.html' && !['404.html','pay.html','payment-success.html','project-intake.html'].includes(target)) {
      const label = seo.enTitle.split(' | ')[0];
      const path = new URL(canonical).pathname;
      const items = [{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.ruutdev.com/' }];
      if (path.startsWith('/solutions/')) items.push({ '@type': 'ListItem', position: 2, name: 'Solutions', item: 'https://www.ruutdev.com/solutions' });
      items.push({ '@type': 'ListItem', position: items.length + 1, name: label, item: canonical });
      const graph = [{ '@type': 'BreadcrumbList', itemListElement: items }];
      if (path.startsWith('/solutions/')) graph.push({ '@type': 'Service', name: label, description: seo.enDescription, url: canonical, areaServed: 'Florida', provider: { '@type': 'Organization', name: 'RuutDev', url: 'https://www.ruutdev.com/' } });
      metadata += `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}</script>`;
    }
    html = html.replace('</head>', `${metadata}</head>`);
  }
  if (!/rel="(?:shortcut )?icon"/i.test(html)) html = html.replace('</head>', '<link rel="icon" href="/favicon.svg" type="image/svg+xml"></head>');
  html = html
    .replace(/<a class="skip"[\s\S]*?<\/a>/i, '')
    .replace(/<header class="site-header"[\s\S]*?<\/header>/i, '')
    .replace(/<div id="nav-placeholder"><\/div>/i, '')
    .replace(/<footer class="(?:site-footer|footer)"[\s\S]*?<\/footer>/i, '')
    .replace(/(<body[^>]*>)/i, `$1${staticHeader}`);
  const scriptAnchor = '<script src="/assets/js/site-config.js"></script>';
  html = html.includes(scriptAnchor) ? html.replace(scriptAnchor, `${staticFooter}${scriptAnchor}`) : html.replace('</body>', `${staticFooter}</body>`);
  await writeFile(file, html, 'utf8');
}

await cp('assets', join(output, 'assets'), { recursive: true });
await rm(join(output, 'assets/js/main.js'), { force: true });
await rm(join(output, 'assets/img/buos-logo.png'), { force: true });

// The operational intake still uses the legacy base stylesheet. Remove the
// retired campaign-only block from the deploy artifact without altering intake.
const legacyCssPath = join(output, 'assets/css/styles.css');
const legacyCss = await readFile(legacyCssPath, 'utf8');
const retiredCampaignStart = legacyCss.indexOf('GOOGLE ADS LANDING PAGE');
if (retiredCampaignStart !== -1) {
  const commentStart = legacyCss.lastIndexOf('/*', retiredCampaignStart);
  await writeFile(legacyCssPath, legacyCss.slice(0, commentStart), 'utf8');
}

const vercel = JSON.parse(await readFile('vercel.json', 'utf8'));
if (vercel.outputDirectory !== 'public') throw new Error('vercel.json outputDirectory must be "public"');
console.log(`Static deployment output created at ${output} (${publicFiles.size} documents).`);
