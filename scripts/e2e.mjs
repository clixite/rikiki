// Vérification E2E : 3 téléphones simulés jouent une partie de Rikiki
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:3111';
const SHOTS = process.env.SHOTS_DIR ?? '/tmp/shots';
const FULL_GAME = process.env.FULL_GAME === '1';

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

async function newPhone(name) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error(`[${name}] pageerror:`, e.message));
  return { name, ctx, page };
}

async function createProfile(phone, pseudo, avatarIndex = 0) {
  const { page } = phone;
  await page.fill('#pseudo', pseudo);
  const avatars = page.locator('.grid button');
  await avatars.nth(avatarIndex).click();
  await page.click('[data-testid="profile-submit"]');
}

const alice = await newPhone('Alice');
const bob = await newPhone('Bob');
const carol = await newPhone('Carol');
const phones = [alice, bob, carol];

// --- Alice crée la partie
await alice.page.goto(`${BASE}/`);
await alice.page.waitForURL('**/profile');
await createProfile(alice, 'Alice', 0);
await alice.page.waitForURL(`${BASE}/`);
await alice.page.waitForSelector('[data-testid="create-game"]:not([disabled])');
await alice.page.screenshot({ path: `${SHOTS}/01-home.png` });
await alice.page.click('[data-testid="create-game"]');
await alice.page.waitForSelector('[data-testid="room-code"]');
const code = (await alice.page.textContent('[data-testid="room-code"]')).trim();
console.log('Code de partie :', code);
if (!/^[A-Z]{4}$/.test(code)) throw new Error(`Code invalide: ${code}`);

// --- Bob et Carol rejoignent via le lien /j/CODE
for (const [phone, pseudo, av] of [[bob, 'Bob', 1], [carol, 'Carol', 2]]) {
  await phone.page.goto(`${BASE}/j/${code}`);
  await phone.page.waitForURL('**/profile');
  await createProfile(phone, pseudo, av);
  await phone.page.waitForSelector('[data-testid="room-code"]', { timeout: 8000 });
}
await alice.page.waitForFunction(() => document.querySelectorAll('li').length >= 3);
await alice.page.screenshot({ path: `${SHOTS}/02-lobby.png` });

// --- Lancement
await alice.page.click('[data-testid="start-game"]');
await Promise.all(phones.map((p) => p.page.waitForSelector('[data-testid^="bid-"]', { timeout: 8000 }).catch(() => null)));

async function playOneRound(roundLabel, screenshotPrefix = null) {
  // Enchères : chacun clique la plus petite enchère légale quand son tour vient
  let emptyChecks = 0;
  for (let guard = 0; guard < 60; guard++) {
    const pickers = await Promise.all(
      phones.map((p) => p.page.locator('button[data-testid^="bid-"]:not([disabled])').count().catch(() => 0)),
    );
    const idx = pickers.findIndex((c) => c > 0);
    if (idx === -1) {
      // laisser le temps au picker du joueur suivant d'apparaître
      emptyChecks++;
      if (emptyChecks >= 3) break;
      await alice.page.waitForTimeout(400);
      continue;
    }
    emptyChecks = 0;
    const phone = phones[idx];
    if (screenshotPrefix && guard === 0) await phone.page.screenshot({ path: `${SHOTS}/${screenshotPrefix}-bidding.png` });
    await phone.page.locator('button[data-testid^="bid-"]:not([disabled])').first().click();
    await phone.page.waitForTimeout(250);
  }

  // Jeu des plis : cliquer une carte légale quand c'est son tour
  for (let guard = 0; guard < 200; guard++) {
    const recapVisible = await alice.page.locator('[data-testid="next-round"]').count();
    if (recapVisible > 0) break;
    let played = false;
    for (const phone of phones) {
      const legal = phone.page.locator('[data-legal="true"] button:not([disabled])');
      if ((await legal.count()) > 0) {
        if (screenshotPrefix && guard === 0) await phone.page.screenshot({ path: `${SHOTS}/${screenshotPrefix}-playing.png` });
        await legal.last().click({ force: true });
        played = true;
        await phone.page.waitForTimeout(300);
        break;
      }
    }
    if (!played) await alice.page.waitForTimeout(400);
  }

  // Récap de manche
  await alice.page.waitForSelector('[data-testid="next-round"]', { timeout: 10000 });
  if (screenshotPrefix) await alice.page.screenshot({ path: `${SHOTS}/${screenshotPrefix}-recap.png` });
  console.log(`Manche ${roundLabel} terminée`);
}

await playOneRound('1', '03-r1');
await alice.page.click('[data-testid="next-round"]');
await alice.page.waitForTimeout(600);
await playOneRound('2', '04-r2');

if (FULL_GAME) {
  // Joue jusqu'à la fin (19 manches à 3 joueurs)
  for (let r = 3; r <= 19; r++) {
    await alice.page.click('[data-testid="next-round"]');
    await alice.page.waitForTimeout(500);
    const over = await alice.page.locator('text=Partie terminée').count();
    if (over > 0) break;
    await playOneRound(String(r));
  }
  await alice.page.click('[data-testid="next-round"]');
  await alice.page.waitForSelector('text=Partie terminée', { timeout: 10000 });
  await alice.page.screenshot({ path: `${SHOTS}/05-gameover.png` });
  console.log('Partie complète terminée !');
} else {
  await alice.page.screenshot({ path: `${SHOTS}/05-final.png` });
}

console.log('E2E OK');
await browser.close();
