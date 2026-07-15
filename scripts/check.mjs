import { readFile, access } from 'node:fs/promises';

const files = ['index.html', 'pages/solutions.html', 'pages/solutions/websites.html', 'pages/solutions/business-systems.html', 'pages/solutions/automation-ai.html', 'pages/portfolio.html', 'pages/process.html', 'pages/about.html', 'pages/contact.html'];
for (const file of files) {
  await access(file);
  const html = await readFile(file, 'utf8');
  for (const required of ['<title>', 'name="description"', 'rel="canonical"', '<main']) {
    if (!html.includes(required)) throw new Error(`${file}: missing ${required}`);
  }
}
for (const file of ['pages/pricing.html', 'pages/privacy.html', 'pages/terms.html']) {
  const html = await readFile(file, 'utf8');
  if (!html.includes('/assets/css/rebuild.css')) throw new Error(`${file}: rebuilt design system is not loaded`);
  if (!html.includes('id="nav-placeholder"')) throw new Error(`${file}: shared navigation placeholder is missing`);
}
JSON.parse(await readFile('vercel.json', 'utf8'));
console.log(`Static checks passed for ${files.length} critical pages.`);
