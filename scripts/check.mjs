import { access, readFile } from 'node:fs/promises';

const criticalPages = [
  'index.html', '404.html', 'pages/solutions.html',
  'pages/solutions/websites.html', 'pages/solutions/business-systems.html',
  'pages/solutions/automation-ai.html', 'pages/portfolio.html',
  'pages/process.html', 'pages/about.html', 'pages/pricing.html',
  'pages/contact.html', 'pages/privacy.html', 'pages/terms.html',
  'pages/pay.html', 'pages/payment-success.html', 'pages/project-intake.html'
];
const forbidden = /pending verification|owner verification|stripe-ready hook|loading reviews|be the first to leave a review|(?<![\p{L}\p{N}_])(?:TODO|FIXME)(?![\p{L}\p{N}_])/iu;

for (const file of criticalPages) {
  await access(file);
  const html = await readFile(file, 'utf8');
  for (const required of ['<title>', 'name="description"', '<main']) {
    if (!html.includes(required)) throw new Error(`${file}: missing ${required}`);
  }
  if (!html.includes('/assets/css/rebuild.css')) throw new Error(`${file}: rebuilt design system is not loaded`);
  if (!html.includes('/assets/js/site-config.js') || !html.includes('/assets/js/rebuild.js')) throw new Error(`${file}: global chrome scripts are missing`);
  if (/GTM-MGKZGHK7|assets\/js\/main\.js/i.test(html)) throw new Error(`${file}: legacy runtime or analytics is still loaded`);
  if (forbidden.test(html)) throw new Error(`${file}: contains internal-only content`);
}

for (const file of criticalPages.filter((file) => !/404|payment-success|project-intake|pay\.html/.test(file))) {
  const html = await readFile(file, 'utf8');
  if (!/rel="canonical" href="https:\/\/www\.ruutdev\.com\//.test(html)) throw new Error(`${file}: canonical must use the production www host`);
}

const routes = JSON.parse(await readFile('vercel.json', 'utf8'));
if (routes.outputDirectory !== 'public' || routes.rewrites) throw new Error('Vercel must serve the allowlisted root output without legacy rewrites');
for (const source of ['/services', '/portfolio', '/google-ads/ai-business-os', '/qualifier']) {
  if (!routes.redirects.some((route) => route.source === source && route.permanent)) throw new Error(`Missing permanent redirect: ${source}`);
}

const sitemap = await readFile('sitemap.xml', 'utf8');
if (sitemap.includes('https://ruutdev.com') || !sitemap.includes('https://www.ruutdev.com')) throw new Error('Sitemap host is inconsistent');
console.log(`Static checks passed for ${criticalPages.length} critical pages.`);
