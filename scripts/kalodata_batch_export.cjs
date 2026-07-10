/* Reusable normal-UI Kalodata exporter. Requires a user-supplied Cookie JSON and Playwright. */
const fs = require('fs');
const os = require('os');
const path = require('path');
const readline = require('readline');
const { chromium } = require('playwright');

function arg(name, fallback) { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : fallback; }
function die(message) { throw new Error(message); }
function cleanCookies(file) {
  const now = Date.now() / 1000;
  const items = JSON.parse(fs.readFileSync(file, 'utf8'));
  const live = items.filter(c => String(c.domain || '').includes('kalodata.com') && (!c.expirationDate || c.expirationDate > now));
  if (!live.length) die('No live Kalodata cookies found.');
  return live.map(c => ({ name:c.name, value:c.value, domain:c.domain, path:c.path || '/', secure:!!c.secure, httpOnly:!!c.httpOnly, sameSite: c.sameSite === 'no_restriction' ? 'None' : c.sameSite === 'lax' ? 'Lax' : c.sameSite === 'strict' ? 'Strict' : undefined, expires:c.expirationDate }));
}
function waitForEnter(message) { return new Promise(resolve => readline.createInterface({ input:process.stdin, output:process.stdout }).question(message, () => resolve())); }
async function mouseText(page, pattern, scope = page) {
  const target = scope.locator('button,[role="button"],a,div,span').filter({ hasText: pattern }).filter({ visible:true }).first();
  const box = await target.boundingBox();
  if (!box) die(`Visible control not found: ${pattern}`);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}
async function closeActivityPopup(page) {
  const selectors = ['.ant-modal .ant-modal-close', '.ant-modal button[aria-label="Close"]', '.ant-modal [aria-label*="close" i]', '.ant-modal [title*="close" i]'];
  for (const selector of selectors) {
    const close = page.locator(selector).filter({ visible:true }).first();
    const box = await close.boundingBox().catch(() => null);
    if (box) { await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2); await page.waitForTimeout(300); return true; }
  }
  return false;
}
async function exportList(page, label, topN) {
  await closeActivityPopup(page);
  const section = page.locator('section,div').filter({ hasText: label }).filter({ visible:true }).first();
  await mouseText(page, /Data Export|数据导出/, section);
  await mouseText(page, /^Excel$/);
  const dialog = page.locator('.ant-modal').filter({ visible:true }).last();
  const inputs = dialog.locator('input');
  if (await inputs.count() >= 2) { await inputs.nth(0).fill('1'); await inputs.nth(1).fill(String(topN)); }
  await mouseText(page, /^(Data Export|数据导出)$/, dialog);
  await page.waitForTimeout(1500);
  await closeActivityPopup(page);
}

(async () => {
  const cookieFile = arg('--cookie'); const urlsFile = arg('--urls'); const topN = Number(arg('--top', '10'));
  const downloads = path.resolve(arg('--downloads', path.join(os.tmpdir(), 'kalodata-downloads')));
  if (!cookieFile || !urlsFile) die('Usage: node kalodata_batch_export.cjs --cookie cookies.json --urls urls.txt [--top 10] [--downloads D:\\kalodata]');
  const urls = fs.readFileSync(urlsFile, 'utf8').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  if (!urls.length) die('No product URLs supplied.');
  fs.mkdirSync(downloads, { recursive:true });
  const browser = await chromium.launch({ headless:false });
  const context = await browser.newContext({ acceptDownloads:true });
  await context.addCookies(cleanCookies(cookieFile));
  const page = await context.newPage();
  try {
    for (let i = 0; i < urls.length; i++) {
      await page.goto(urls[i], { waitUntil:'domcontentloaded' });
      if (i === 0) await waitForEnter('Close the visible Kalodata activity popup, then press Enter to continue: ');
      await exportList(page, /Creator|达人/, topN);
      await exportList(page, /Video|视频|Advertising|广告/, topN);
    }
    console.log(JSON.stringify({ ok:true, downloads, products:urls.length, topN }));
  } finally { await context.close(); await browser.close(); }
})().catch(err => { console.error(err.message); process.exit(1); });
