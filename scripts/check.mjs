import { readFile, access } from 'node:fs/promises';

const files = ['index.html', 'pages/solutions.html', 'pages/solutions/websites.html', 'pages/solutions/business-systems.html', 'pages/solutions/automation-ai.html', 'pages/portfolio.html', 'pages/process.html', 'pages/about.html', 'pages/contact.html'];
for (const file of files) {
  await access(file);
  const html = await readFile(file, 'utf8');
  for (const required of ['<title>', 'name="description"', 'rel="canonical"', '<main']) {
    if (!html.includes(required)) throw new Error(`${file}: missing ${required}`);
  }
}
JSON.parse(await readFile('vercel.json', 'utf8'));
console.log(`Static checks passed for ${files.length} critical pages.`);
