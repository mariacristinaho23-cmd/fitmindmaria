const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  try {
    await page.goto('http://localhost:8000', { waitUntil: 'networkidle0' });
    const content = await page.evaluate(() => document.body.innerText);
    console.log("HTML TEXT CONTENT:", content.substring(0, 500));
  } catch(e) {
    console.log("Error:", e.message);
  }
  await browser.close();
})();
