import { chromium } from 'playwright';
const dir = '/tmp/claude-0/-home-user-rikiki/c3168118-535c-5a1b-a875-d47e3c8d1d57/scratchpad';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 900, height: 1000 }, deviceScaleFactor: 2 });
await p.goto('file://' + dir + '/avatars.html');
await p.screenshot({ path: dir + '/avatars.png', fullPage: true });
await b.close();
console.log('shot ok');
