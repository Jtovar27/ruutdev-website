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
  for (const file of ['pages/pricing.html', 'pages/privacy.html', 'pages/terms.html']) {
    const html = await readFile(file, 'utf8');
    assert.match(html, /assets\/css\/rebuild\.css/);
    assert.match(html, /id="nav-placeholder"/);
  }
});
