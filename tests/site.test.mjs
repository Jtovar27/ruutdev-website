import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import vm from 'node:vm';
import contactHandler from '../api/contact.js';

async function config() {
  const code = await readFile('assets/js/site-config.js', 'utf8');
  const context = { window: {} };
  vm.runInNewContext(code, context);
  return context.window.RUUTDEV;
}

async function walk(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await walk(path));
    else result.push(path);
  }
  return result;
}

function responseMock() {
  return { statusCode: 200, body: null, headers: {}, setHeader(key, value) { this.headers[key] = value; }, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; }, end() { return this; } };
}

test('future product stays disabled and unverified work is not public', async () => {
  const site = await config();
  assert.equal(site.features.futureProductEnabled, false);
  assert.equal(site.projects.length, 0);
});

test('approved pricing and five Stripe links remain unchanged', async () => {
  const site = await config();
  assert.deepEqual([...site.pricing.websitePlans].map((p) => [p.setup, p.monthly]), [[149,45],[249,97],[399,145]]);
  assert.deepEqual([site.pricing.deposits.website.amount, site.pricing.deposits.softwareAutomation.amount], [500,750]);
  assert.equal(site.pricing.websitePlans.filter((plan) => plan.checkoutUrl.startsWith('https://buy.stripe.com/')).length, 3);
  assert.ok(site.pricing.deposits.website.checkoutUrl.startsWith('https://buy.stripe.com/'));
  assert.ok(site.pricing.deposits.softwareAutomation.checkoutUrl.startsWith('https://buy.stripe.com/'));
});

test('legacy routes are permanent redirects and physical source routes are not built', async () => {
  const routes = JSON.parse(await readFile('vercel.json', 'utf8'));
  for (const source of ['/services','/portfolio','/google-ads/ai-business-os','/qualifier']) {
    assert.ok(routes.redirects.some((route) => route.source === source && route.permanent));
  }
  await assert.rejects(access('public/pages'));
  await assert.rejects(access('public/qualifier.html'));
  await assert.rejects(access('public/assets/js/main.js'));
  await assert.rejects(access('public/assets/img/buos-logo.png'));
});

test('public deployment contains one global shell and no internal-only text', async () => {
  const forbidden = /pending verification|owner verification|stripe-ready hook|loading reviews|be the first to leave a review|ai business os|(?<![\p{L}\p{N}_])BUOS(?![\p{L}\p{N}_])|coming soon|(?<![\p{L}\p{N}_])(?:TODO|FIXME)(?![\p{L}\p{N}_])/iu;
  const files = await walk('public');
  for (const file of files.filter((name) => /\.(?:html|js|css)$/.test(name))) {
    const contents = await readFile(file, 'utf8');
    const isInternalAdmin = file.endsWith(join('admin', 'intakes.html'));
    if (!isInternalAdmin) assert.doesNotMatch(contents, forbidden, file);
    if (file.endsWith('.html') && !isInternalAdmin) {
      assert.equal((contents.match(/<header class="site-header">/g) || []).length, 1, file);
      assert.equal((contents.match(/<footer class="footer">/g) || []).length, 1, file);
      assert.match(contents, /class="skip"/);
      assert.match(contents, /<main/);
      assert.doesNotMatch(contents, /href="\/(?:services|portfolio)(?:[/?#"])/);
    }
  }
});

test('contact form and API require consent and include spam controls', async () => {
  const html = await readFile('pages/contact.html', 'utf8');
  assert.match(html, /name="consent"[^>]*required/);
  assert.match(html, /name="website"[^>]*tabindex="-1"/);
  assert.match(html, /aria-describedby="email-error"/);
  const invalid = responseMock();
  await contactHandler({ method: 'POST', headers: { 'x-forwarded-for': 'test-consent' }, socket: {}, body: { name: 'A', email: 'a@example.com', business: 'B', type: 'website', message: 'Details', consent: false, website: '' } }, invalid);
  assert.equal(invalid.statusCode, 400);
  const bot = responseMock();
  await contactHandler({ method: 'POST', headers: {}, socket: {}, body: { website: 'spam' } }, bot);
  assert.equal(bot.statusCode, 200);
});

test('pay page uses fixed links and does not imply a custom Stripe amount', async () => {
  const html = await readFile('pages/pay.html', 'utf8');
  assert.doesNotMatch(html, /id="pay-amount"|type="number"/);
  assert.match(html, /data-deposit-kind="website"/);
  assert.match(html, /data-deposit-kind="softwareAutomation"/);
});

test('SEO essentials, structured data, sitemap, robots, and 404 are valid', async () => {
  const home = await readFile('index.html', 'utf8');
  const schemaText = home.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  assert.doesNotThrow(() => JSON.parse(schemaText));
  const sitemap = await readFile('sitemap.xml', 'utf8');
  assert.match(sitemap, /https:\/\/www\.ruutdev\.com\/solutions/);
  assert.doesNotMatch(sitemap, /https:\/\/ruutdev\.com/);
  assert.match(await readFile('robots.txt', 'utf8'), /Sitemap: https:\/\/www\.ruutdev\.com\/sitemap\.xml/);
  assert.match(await readFile('public/404.html', 'utf8'), /name="robots" content="noindex,follow"/);
  await access('public/favicon.svg');
});

test('indexable output has social metadata, breadcrumbs, and localized commercial alternates', async () => {
  const pages = ['index.html','solutions.html','solutions/websites.html','solutions/business-systems.html','solutions/automation-ai.html','work.html','process.html','about.html','pricing.html','contact.html','privacy.html','terms.html'];
  for (const page of pages) {
    const html = await readFile(join('public', page), 'utf8');
    for (const token of ['property="og:title"','property="og:description"','property="og:url"','name="twitter:card"','name="twitter:title"','name="twitter:description"']) assert.match(html, new RegExp(token), page);
    for (const schema of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) assert.doesNotThrow(() => JSON.parse(schema[1]), page);
    if (page !== 'index.html') assert.match(html, /BreadcrumbList/, page);
    if (!['privacy.html','terms.html'].includes(page)) assert.match(html, /hreflang="es"/, page);
  }
  for (const page of ['solutions/websites.html','solutions/business-systems.html','solutions/automation-ai.html']) assert.match(await readFile(join('public', page), 'utf8'), /"@type":"Service"/);
});

test('language preference supports explicit Spanish URLs', async () => {
  const script = await readFile('assets/js/rebuild.js', 'utf8');
  assert.match(script, /URLSearchParams/);
  assert.match(script, /requested === 'es'/);
  assert.match(await readFile('index.html', 'utf8'), /hreflang="es" href="https:\/\/www\.ruutdev\.com\/\?lang=es"/);
});
