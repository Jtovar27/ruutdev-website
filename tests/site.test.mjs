import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

test('future product stays disabled and project statuses are valid', async () => {
  const code = await readFile('assets/js/site-config.js', 'utf8');
  const context = { window: {} };
  vm.runInNewContext(code, context);
  assert.equal(context.window.RUUTDEV.features.futureProductEnabled, false);
  for (const project of context.window.RUUTDEV.projects) assert.ok(['client', 'demo', 'concept'].includes(project.status));
});

test('pricing keeps approved amounts', async () => {
  const code = await readFile('assets/js/site-config.js', 'utf8');
  const context = { window: {} };
  vm.runInNewContext(code, context);
  assert.deepEqual([...context.window.RUUTDEV.pricing.websitePlans].map((p) => [p.setup, p.monthly]), [[149,45],[249,97],[399,145]]);
});

test('routing retires public future-product campaign safely', async () => {
  const config = JSON.parse(await readFile('vercel.json', 'utf8'));
  const route = config.rewrites.find((item) => item.source === '/google-ads/ai-business-os');
  assert.equal(route.destination, '/pages/solutions/automation-ai');
});

test('contact has consent and spam controls', async () => {
  const [html, api] = await Promise.all([readFile('pages/contact.html', 'utf8'), readFile('api/contact.js', 'utf8')]);
  assert.match(html, /name="consent" required/);
  assert.match(html, /name="website"/);
  assert.match(api, /!isLegacyLanding && consent !== true/);
  assert.match(api, /429/);
});

test('pricing and legal pages use the rebuilt design system', async () => {
  for (const file of ['pages/privacy.html', 'pages/terms.html']) {
    const html = await readFile(file, 'utf8');
    assert.match(html, /assets\/css\/rebuild\.css/);
    assert.match(html, /id="nav-placeholder"/);
  }
  const pricing = await readFile('pages/pricing.html', 'utf8');
  assert.match(pricing, /assets\/css\/rebuild\.css/);
  assert.match(pricing, /assets\/js\/rebuild\.js/);
});

test('services route is retired as a redirect only', async () => {
  const config = JSON.parse(await readFile('vercel.json', 'utf8'));
  assert.equal(config.rewrites.some((item) => item.source === '/services'), false);
  const redirect = config.redirects.find((item) => item.source === '/services');
  assert.deepEqual(redirect, { source: '/services', destination: '/solutions', permanent: true });
});

test('public trust copy has no legacy leakage', async () => {
  const publicFiles = [
    'index.html',
    'pages/solutions.html',
    'pages/solutions/websites.html',
    'pages/solutions/business-systems.html',
    'pages/solutions/automation-ai.html',
    'pages/portfolio.html',
    'pages/portfolio/taxes-insurance-group.html',
    'pages/portfolio/la-cafebreria.html',
    'pages/portfolio/acaballo-equestrian-school.html',
    'pages/process.html',
    'pages/about.html',
    'pages/pricing.html',
    'pages/contact.html',
    'pages/privacy.html',
    'pages/terms.html',
    'pages/pay.html',
    'pages/payment-success.html',
    'pages/project-intake.html',
    'pages/google-ads/ai-business-os.html'
  ];
  for (const file of publicFiles) {
    const html = await readFile(file, 'utf8');
    assert.doesNotMatch(html, /helloruutdev@hotmail\.com/i, `${file} exposes the old email`);
    assert.doesNotMatch(html, /Pending verification|Pending owner verification|pending owner verification/i, `${file} exposes internal verification copy`);
    assert.doesNotMatch(html, /USA and Venezuela|USA &amp; Venezuela|USA & LATAM|USA &amp; LATAM/i, `${file} exposes old market language`);
    assert.doesNotMatch(html, /href="\/services"/i, `${file} links to retired /services`);
  }
});
