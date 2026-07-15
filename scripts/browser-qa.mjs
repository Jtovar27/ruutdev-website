import { access, mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { join } from 'node:path';

const baseUrl = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const port = Number(process.env.QA_CHROME_PORT || 9224);
const output = join(process.cwd(), '.qa');
await mkdir(output, { recursive: true });

const candidates = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome'
].filter(Boolean);
let chromePath;
for (const candidate of candidates) {
  try { await access(candidate); chromePath = candidate; break; } catch { /* try next */ }
}
if (!chromePath) throw new Error('Chrome was not found. Set CHROME_PATH.');

const chrome = spawn(chromePath, [
  '--headless=new', `--remote-debugging-port=${port}`,
  `--user-data-dir=${join(output, 'chrome-profile')}`,
  '--disable-gpu', '--no-first-run', '--no-default-browser-check', 'about:blank'
], { stdio: 'ignore', windowsHide: true });

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitForChrome() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try { const response = await fetch(`http://127.0.0.1:${port}/json/version`); if (response.ok) return; } catch { /* retry */ }
    await delay(100);
  }
  throw new Error('Chrome DevTools endpoint did not start.');
}

let socket;
const results = [];
try {
  await waitForChrome();
  const target = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' }).then((response) => response.json());
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let nextId = 0;
  const pending = new Map();
  const consoleErrors = [];
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id); pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message)); else resolve(message.result);
    }
    if (message.method === 'Runtime.exceptionThrown') consoleErrors.push(message.params.exceptionDetails.text || 'Runtime exception');
    if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') consoleErrors.push(message.params.entry.text);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params }));
  });
  await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');

  async function evaluate(expression) {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  }
  async function audit(path, width, screenshot = true) {
    consoleErrors.length = 0;
    await send('Emulation.setDeviceMetricsOverride', { width, height: 1200, deviceScaleFactor: 1, mobile: width < 768 });
    await send('Page.navigate', { url: `${baseUrl}/${path}` });
    await delay(450);
    await evaluate('document.fonts ? document.fonts.ready.then(() => true) : true');
    await evaluate('window.scrollTo(0,0)');
    const metrics = await evaluate(`({
      path: location.pathname + location.search,
      innerWidth,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      headerCount: document.querySelectorAll('header.site-header').length,
      footerCount: document.querySelectorAll('footer.footer').length,
      mainCount: document.querySelectorAll('main').length,
      logoCount: document.querySelectorAll('header.site-header a.logo').length,
      scrollY,
      lang: document.documentElement.lang
    })`);
    if (screenshot) {
      const image = await send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
      await writeFile(join(output, `cdp-${path.replace(/[/?=&.]/g, '-')}-${width}.png`), Buffer.from(image.data, 'base64'));
    }
    const row = { ...metrics, width, overflow: metrics.scrollWidth > metrics.clientWidth, consoleErrors: [...consoleErrors] };
    results.push(row);
    return row;
  }

  for (const width of [320, 360, 390, 430, 768, 1024, 1280, 1440, 1920]) await audit('index.html', width, [320,390,1440].includes(width));
  for (const page of ['solutions.html','work.html','pricing.html','contact.html','privacy.html','terms.html','pay.html']) {
    await audit(page, 390); await audit(page, 1440, false);
  }
  const spanish = await audit('contact.html?lang=es', 390);
  spanish.localizedHeading = await evaluate("document.querySelector('h1')?.textContent.trim()");
  spanish.preferredLanguage = await evaluate("document.getElementById('preferredLanguage')?.value");

  await audit('index.html', 390, false);
  await evaluate("document.querySelector('[data-menu]').click()");
  const opened = await evaluate("({expanded:document.querySelector('[data-menu]').getAttribute('aria-expanded'),open:document.getElementById('site-nav').classList.contains('open'),locked:document.body.style.overflow})");
  await evaluate("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))");
  const closed = await evaluate("({expanded:document.querySelector('[data-menu]').getAttribute('aria-expanded'),open:document.getElementById('site-nav').classList.contains('open'),locked:document.body.style.overflow})");

  await evaluate("localStorage.setItem('ruutdev_lang','en')");
  await audit('contact.html', 390, false);
  const validation = await evaluate(`(() => {
    document.querySelector('#contact-form [type=submit]').click();
    return { active: document.activeElement?.name, error: document.getElementById('name-error')?.textContent, invalid: document.getElementById('name')?.getAttribute('aria-invalid') };
  })()`);
  const fillContact = `(() => {
    const form = document.getElementById('contact-form');
    Object.assign(form.elements.name,{value:'Browser QA'}); Object.assign(form.elements.business,{value:'QA Business'});
    Object.assign(form.elements.email,{value:'qa@example.com'}); Object.assign(form.elements.businessType,{value:'Service business'});
    form.elements.improvement.value='website'; form.elements.currentProcess.value='Manual process'; form.elements.consent.checked=true;
    form.dispatchEvent(new Event('input',{bubbles:true})); return form;
  })()`;
  const success = await evaluate(`(async () => { const form=${fillContact}; window.fetch=async()=>new Response('{"success":true}',{status:200,headers:{'Content-Type':'application/json'}}); form.requestSubmit(); await new Promise(r=>setTimeout(r,80)); return { text:document.getElementById('form-status').textContent, hidden:document.getElementById('form-status').classList.contains('hidden'), reset:form.elements.name.value==='' }; })()`);
  const error = await evaluate(`(async () => { const form=${fillContact}; window.fetch=async()=>new Response('{"error":"mock"}',{status:502,headers:{'Content-Type':'application/json'}}); form.requestSubmit(); await new Promise(r=>setTimeout(r,80)); return { text:document.getElementById('form-status').textContent, hidden:document.getElementById('form-status').classList.contains('hidden') }; })()`);

  const failures = results.filter((row) => row.innerWidth !== row.width || row.overflow || row.headerCount !== 1 || row.footerCount !== 1 || row.mainCount !== 1 || row.logoCount !== 1 || row.scrollY !== 0 || row.consoleErrors.length);
  const report = { baseUrl, testedAt: new Date().toISOString(), results, menu: { opened, closed }, contact: { validation, success, error }, failures };
  await writeFile(join(output, 'browser-qa.json'), JSON.stringify(report, null, 2), 'utf8');
  if (spanish.lang !== 'es' || !spanish.localizedHeading?.includes('Qué') || spanish.preferredLanguage !== 'Español') throw new Error('Spanish route parity check failed.');
  if (opened.expanded !== 'true' || !opened.open || opened.locked !== 'hidden' || closed.expanded !== 'false' || closed.open || closed.locked) throw new Error('Mobile menu behavior failed.');
  if (validation.active !== 'name' || validation.invalid !== 'true' || !validation.error || success.hidden || !success.reset || !/Thank you/i.test(success.text) || error.hidden || !/could not be sent/i.test(error.text)) throw new Error('Mocked contact flow failed.');
  if (failures.length) throw new Error(`Browser QA found ${failures.length} failing viewport/page combinations.`);
  console.log(`Browser QA passed ${results.length} viewport/page combinations.`);
} finally {
  socket?.close();
  chrome.kill();
}
